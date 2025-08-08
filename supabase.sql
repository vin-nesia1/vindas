CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE form_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    purpose TEXT NOT NULL,
    platform_link TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
