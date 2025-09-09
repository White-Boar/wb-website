# Environment Setup Guide - WhiteBoar Onboarding System

This guide helps you configure the required environment variables for the WhiteBoar onboarding system.

## Quick Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required values in `.env.local` (see sections below)

3. Verify setup by running:
   ```bash
   pnpm dev
   ```

## Required Services Setup

### 1. Supabase Configuration

**What it's for**: Database storage, authentication, and file uploads

**Setup Steps**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project or create a new one
3. Go to Settings → API
4. Copy the following values to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

**Important**: 
- The service key is for server-side operations only
- Never expose the service key in client-side code

### 2. Resend Email Service

**What it's for**: Sending verification emails and notifications

**Setup Steps**:
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Create an API key
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_your-api-key-here
   ```

**Email Configuration**:
- **From Email**: noreply.notifications@whiteboar.it
- **Domain**: Ensure whiteboar.it is verified in Resend
- **Templates**: Will be created programmatically

### 3. Google Maps API

**What it's for**: Address autocomplete in Step 3 (Business Details)

**Setup Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Maps JavaScript API
3. Create an API key
4. Restrict the API key to your domain
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key
   ```

**Required APIs**:
- Maps JavaScript API
- Places API (for address autocomplete)

## Optional Services

### Vercel Analytics

**What it's for**: Conversion tracking and performance monitoring

**Setup Steps**:
1. Enable Analytics in your Vercel project
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
   ```

## Configuration Values

### Application Settings

```bash
# Development
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_APP_URL=https://whiteboar.it
```

### Security Configuration

```bash
# Generate a secure random string for JWT signing
SESSION_SECRET=your-super-secret-key-here

# Rate limiting for OTP attempts
MAX_OTP_ATTEMPTS=5
OTP_LOCKOUT_MINUTES=15

# File upload limits
MAX_LOGO_SIZE_MB=10
MAX_PHOTOS_SIZE_MB=50
```

### Email Settings

```bash
# Email sender configuration
FROM_EMAIL=noreply.notifications@whiteboar.it
FROM_NAME=WhiteBoar
ADMIN_EMAIL=admin@whiteboar.it
SUPPORT_EMAIL=support@whiteboar.it
```

## Database Setup

After configuring Supabase, you'll need to create the database schema. This will be covered in the next setup step.

## Verification Checklist

Before starting development, verify:

- [ ] All required environment variables are set
- [ ] Supabase connection works
- [ ] Resend API key is valid
- [ ] Google Maps API is enabled and restricted
- [ ] Domain whiteboar.it is configured in Resend
- [ ] `.env.local` is added to `.gitignore`

## Troubleshooting

### Common Issues

**Supabase Connection Failed**:
- Check if the URL and keys are correct
- Verify project is not paused
- Ensure RLS policies allow anonymous access where needed

**Email Sending Failed**:
- Verify Resend API key is active
- Check domain verification status
- Ensure from email address is verified

**Google Maps Not Loading**:
- Check API key restrictions
- Verify billing account is set up
- Ensure required APIs are enabled

**Environment Variables Not Loading**:
- Restart the development server after changes
- Check file name is exactly `.env.local`
- Verify no syntax errors in the file

## Security Notes

1. **Never commit** `.env.local` to version control
2. **Use different keys** for development and production
3. **Restrict API keys** to specific domains in production
4. **Rotate secrets** regularly in production
5. **Monitor usage** of external services for unexpected activity

## Production Deployment

For production deployment on Vercel:

1. Add all environment variables in Vercel dashboard
2. Update `NEXT_PUBLIC_APP_URL` to production domain
3. Ensure all services are configured for production domain
4. Test email delivery and API connections before launch