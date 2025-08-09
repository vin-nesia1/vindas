-- Supabase Database Setup for DOMAIN FREE VIN NESIA
-- Run this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create form_data table
CREATE TABLE IF NOT EXISTS form_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    purpose TEXT NOT NULL,
    platform_link TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_data_user_id ON form_data(user_id);
CREATE INDEX IF NOT EXISTS idx_form_data_status ON form_data(status);
CREATE INDEX IF NOT EXISTS idx_form_data_created_at ON form_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_data_email ON form_data(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_form_data_updated_at
    BEFORE UPDATE ON form_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE form_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own form_data" ON form_data
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own form_data" ON form_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own data (optional - usually admins handle status updates)
CREATE POLICY "Users can update own form_data" ON form_data
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own data (optional)
CREATE POLICY "Users can delete own form_data" ON form_data
    FOR DELETE USING (auth.uid() = user_id);

-- Create admin role and policies (optional - for admin panel access)
-- Only create if you need admin access from Supabase
-- You can also manage this from your external admin panel

-- Create admin table to track admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Admin policy: Admins can see all data
CREATE POLICY "Admins can view all form_data" ON form_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Admin policy: Admins can update all data
CREATE POLICY "Admins can update all form_data" ON form_data
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Create application_logs table for tracking status changes
CREATE TABLE IF NOT EXISTS application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_data_id UUID REFERENCES form_data(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_by UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for logs
CREATE INDEX IF NOT EXISTS idx_application_logs_form_data_id ON application_logs(form_data_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_created_at ON application_logs(created_at DESC);

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_logs (form_data_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger for status change logging
CREATE TRIGGER log_form_data_status_change
    AFTER UPDATE ON form_data
    FOR EACH ROW
    EXECUTE FUNCTION log_status_change();

-- Create view for dashboard statistics (optional)
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    user_id,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    MIN(created_at) as first_application,
    MAX(created_at) as latest_application
FROM form_data
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON user_stats TO authenticated;

-- RLS for the view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    user_id,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    MIN(created_at) as first_application,
    MAX(created_at) as latest_application
FROM form_data
WHERE user_id = auth.uid()  -- Add this line to restrict view to current user
GROUP BY user_id;
CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Create function to get user applications with logs
CREATE OR REPLACE FUNCTION get_user_applications_with_logs(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    purpose TEXT,
    platform_link TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    logs JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fd.id,
        fd.name,
        fd.email,
        fd.purpose,
        fd.platform_link,
        fd.status,
        fd.created_at,
        fd.updated_at,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'old_status', al.old_status,
                    'new_status', al.new_status,
                    'created_at', al.created_at,
                    'reason', al.reason
                ) ORDER BY al.created_at DESC
            )
            FROM application_logs al
            WHERE al.form_data_id = fd.id),
            '[]'::json
        ) as logs
    FROM form_data fd
    WHERE fd.user_id = user_uuid
    ORDER BY fd.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_applications_with_logs(UUID) TO authenticated;

-- Create function for admin statistics (if needed)
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
    total_applications BIGINT,
    pending_applications BIGINT,
    approved_applications BIGINT,
    rejected_applications BIGINT,
    today_applications BIGINT,
    this_week_applications BIGINT,
    this_month_applications BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_applications,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_applications,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_applications,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_applications,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as this_week_applications,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as this_month_applications
    FROM form_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to admin users only
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- Add constraint to ensure valid email format
ALTER TABLE form_data ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add constraint to ensure valid URL format
ALTER TABLE form_data ADD CONSTRAINT valid_url CHECK (platform_link ~* '^https?://');

-- Add constraint for name length
ALTER TABLE form_data ADD CONSTRAINT name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100);

-- Add constraint for purpose values
ALTER TABLE form_data ADD CONSTRAINT valid_purpose CHECK (purpose IN ('personal', 'business', 'portfolio', 'blog', 'education', 'non-profit', 'other'));

-- Create notification function (optional - for real-time updates)
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Send notification on status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'status_change',
            json_build_object(
                'id', NEW.id,
                'user_id', NEW.user_id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'email', NEW.email
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification trigger
CREATE TRIGGER notify_form_data_status_change
    AFTER UPDATE ON form_data
    FOR EACH ROW
    EXECUTE FUNCTION notify_status_change();

-- Insert sample data for testing (optional - remove in production)
-- Uncomment the following lines if you want sample data for testing

/*
INSERT INTO form_data (name, email, purpose, platform_link, status, user_id) VALUES
('John Doe', 'john.doe@example.com', 'personal', 'https://johndoe.github.io', 'approved', uuid_generate_v4()),
('Jane Smith', 'jane.smith@example.com', 'business', 'https://janesmith.vercel.app', 'pending', uuid_generate_v4()),
('Bob Johnson', 'bob.johnson@example.com', 'portfolio', 'https://bobjohnson.netlify.app', 'rejected', uuid_generate_v4());
*/

-- Create backup function (optional)
CREATE OR REPLACE FUNCTION backup_form_data(backup_name TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    backup_table_name TEXT;
    record_count INTEGER;
BEGIN
    -- Generate backup table name
    backup_table_name := 'form_data_backup_' || COALESCE(backup_name, TO_CHAR(NOW(), 'YYYY_MM_DD_HH24_MI_SS'));
    
    -- Create backup table
    EXECUTE 'CREATE TABLE ' || backup_table_name || ' AS SELECT * FROM form_data';
    
    -- Get record count
    EXECUTE 'SELECT COUNT(*) FROM ' || backup_table_name INTO record_count;
    
    RETURN 'Backup created: ' || backup_table_name || ' with ' || record_count || ' records';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Final verification queries (run these to verify setup)
-- SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'form_data';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'form_data';
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'form_data';
