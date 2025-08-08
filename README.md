# DOMAIN FREE VIN NESIA

A complete static website project for free domain registration with user authentication, form submission, and admin panel integration.

## 🚀 Features

- **User Authentication**: Google, GitHub, Facebook login via Supabase Auth
- **Domain Registration Form**: Secure form submission with validation
- **User Dashboard**: Track application status in real-time
- **Admin Integration**: Serverless API integration with admin panel
- **Responsive Design**: Mobile-first design with dark theme
- **SEO Optimized**: Complete meta tags and structured data
- **Real-time Updates**: Live status tracking and notifications

## 📁 Project Structure

```
/ (root)
├── index.html              # Main form page with auth
├── dashboard.html           # User dashboard
├── about.html              # About page (SEO)
├── help.html               # Help/FAQ page (SEO)
├── css/
│   └── style.css           # Custom styles and animations
├── js/
│   ├── auth.js             # Authentication handler
│   ├── form.js             # Form submission logic
│   └── dashboard.js        # Dashboard functionality
├── api/
│   └── send.js             # Vercel serverless function
├── supabase.sql            # Database setup script
└── README.md               # This file
```

## 🔧 Setup Instructions

### 1. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Database Setup
1. Go to SQL Editor in your Supabase dashboard
2. Run the complete script from `supabase.sql`
3. This will create:
   - `form_data` table with proper constraints
   - Row Level Security policies
   - Indexes for performance
   - Admin tables (optional)
   - Logging system
   - Helper functions

#### Authentication Setup
1. Go to Authentication > Settings
2. Enable the following providers:
   - **Google**: Add your Google OAuth credentials
   - **GitHub**: Add your GitHub OAuth App credentials  
   - **Facebook**: Add your Facebook App credentials
3. Set Site URL to your domain: `https://subdomain.vinnesia.my.id`
4. Add redirect URLs:
   - `https://subdomain.vinnesia.my.id`
   - `https://subdomain.vinnesia.my.id/dashboard.html`

#### Get Supabase Credentials
```javascript
// Update in js/auth.js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 2. Vercel Deployment

#### GitHub Repository Setup
1. Create a new GitHub repository
2. Push all files to the repository:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/domain-free-vinnesia.git
git push -u origin main
```

#### Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set up environment variables in Vercel dashboard:

```env
ADMIN_API_URL=https://your-admin-panel.com/api/applications
ADMIN_API_KEY=your-secret-api-key
```

#### Vercel Configuration (Optional)
Create `vercel.json` in root:
```json
{
  "functions": {
    "api/send.js": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### 3. Domain Configuration

#### DNS Setup for subdomain.vinnesia.my.id

Add these DNS records in your domain provider (e.g., Cloudflare, Namecheap):

```dns
# A Records (IPv4)
A    subdomain    76.76.19.19
A    subdomain    76.76.21.21

# AAAA Records (IPv6)
AAAA subdomain    2600:1f16:d83:1202::1
AAAA subdomain    2600:1f16:d83:1201::1

# CNAME Record (Alternative to A records)
CNAME subdomain   cname.vercel-dns.com

# NS Records (if using subdomain nameservers)
NS   subdomain    ns1.vercel-dns.com
NS   subdomain    ns2.vercel-dns.com

# TXT Record (for verification)
TXT  subdomain    "vercel-domain-verification=your-verification-code"
```

#### Vercel Domain Setup
1. Go to your Vercel project settings
2. Click "Domains"
3. Add `subdomain.vinnesia.my.id`
4. Follow verification steps
5. Ensure SSL certificate is issued

#### DNS Propagation
- DNS changes can take 24-48 hours to propagate globally
- Use tools like `dig` or online DNS checkers to verify:
```bash
dig subdomain.vinnesia.my.id
nslookup subdomain.vinnesia.my.id
```

### 4. Environment Variables Setup

#### Vercel Environment Variables
In your Vercel dashboard, add:

| Variable | Value | Description |
|----------|--------|-------------|
| `ADMIN_API_URL` | `https://your-admin-panel.com/api/applications` | Admin panel API endpoint |
| `ADMIN_API_KEY` | `your-secret-api-key` | API authentication key |
| `NODE_ENV` | `production` | Environment mode |

#### Frontend Configuration
Update `js/auth.js` with your Supabase credentials:
```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 5. Testing the Setup

#### Local Testing
1. Use a local server to test:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

2. Test authentication flows
3. Submit test applications
4. Verify dashboard functionality

#### Production Testing
1. Test all authentication methods
2. Submit test applications
3. Check API function logs in Vercel
4. Verify email notifications (if configured)
5. Test responsive design on different devices

## 🔐 Security Considerations

### Row Level Security (RLS)
- All database tables have RLS enabled
- Users can only access their own data
- Admin access is properly controlled

### API Security
- Environment variables for sensitive data
- API key authentication for admin panel
- Input validation and sanitization
- Rate limiting on serverless functions

### Frontend Security
- HTTPS enforced
- CSRF protection
- XSS prevention through input sanitization
- Secure cookie handling

## 📊 Monitoring & Analytics

### Vercel Analytics
Enable Vercel Analytics for:
- Page views and user behavior
- Performance monitoring
- Error tracking

### Supabase Monitoring
Monitor in Supabase dashboard:
- Database performance
- API usage
- Authentication metrics
- Error logs

### Custom Logging
The system logs:
- Form submissions
- Status changes
- API requests
- Authentication events

## 🚨 Troubleshooting

### Common Issues

#### Authentication Not Working
1. Check Supabase URL/Key in `js/auth.js`
2. Verify OAuth provider settings
3. Check browser console for errors
4. Ensure redirect URLs are correct

#### Form Submission Failing
1. Check Vercel function logs
2. Verify environment variables
3. Test admin API endpoint manually
4. Check network connectivity

#### Database Issues
1. Verify RLS policies
2. Check user permissions
3. Review SQL constraints
4. Monitor Supabase logs

#### DNS/Domain Issues
1. Check DNS propagation
2. Verify Vercel domain settings
3. Test SSL certificate
4. Check firewall settings

### Debug Commands
```bash
# Check DNS
dig subdomain.vinnesia.my.id
nslookup subdomain.vinnesia.my.id

# Test API locally
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","purpose":"personal","platform_link":"https://example.com"}'

# Check SSL
curl -I https://subdomain.vinnesia.my.id
```

## 📈 Performance Optimization

### Image Optimization
- Use WebP format for images
- Implement lazy loading
- Optimize file sizes

### Code Optimization
- Minify CSS/JavaScript in production
- Enable Vercel edge caching
- Use CDN for static assets

### Database Optimization
- Proper indexing implemented
- Query optimization
- Connection pooling via Supabase

## 🔄 Maintenance

### Regular Tasks
- Monitor error logs
- Update dependencies
- Backup database
- Review security settings
- Check SSL certificate renewal

### Backup Strategy
```sql
-- Create manual backup
SELECT backup_form_data('monthly_backup_2025_01');

-- Export data
\copy form_data to 'backup.csv' csv header;
```

## 📞 Support

### Contact Information
- **Admin**: admin@vinnesia.my.id
- **Support**: support@vinnesia.my.id
- **Privacy**: privacy@vinnesia.my.id

### Documentation Links
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

© 2025 VIN NESIA. All rights reserved. Built with ❤️ for everyone.

---

## 🎯 Quick Start Checklist

- [ ] Create Supabase project
- [ ] Run SQL setup script
- [ ] Configure authentication providers
- [ ] Update Supabase credentials in code
- [ ] Push code to GitHub repository
- [ ] Deploy to Vercel
- [ ] Set environment variables in Vercel
- [ ] Configure DNS records
- [ ] Add domain to Vercel project
- [ ] Test all functionality
- [ ] Monitor logs and performance

**Estimated Setup Time**: 2-4 hours depending on DNS propagation

For additional help, please contact our support team or check the troubleshooting section above.
