# Supabase Database Setup Guide

This guide walks you through setting up the Supabase database for the WhiteBoar onboarding system.

## Prerequisites

- Supabase project created and configured (see ENVIRONMENT_SETUP.md)
- Access to Supabase SQL editor
- Environment variables configured

## Database Schema Setup

### 1. Run the Schema Migration

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy the contents of `supabase/schema.sql`
5. Paste and run the SQL script

This will create:
- **4 main tables** with proper relationships
- **Performance indexes** for optimal queries
- **Row Level Security (RLS) policies** for data protection
- **Automatic triggers** for data maintenance
- **Cleanup functions** for maintenance and GDPR compliance

### 2. Verify Schema Creation

After running the schema, verify these tables exist:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'onboarding_%';
```

Expected output:
- `onboarding_sessions`
- `onboarding_submissions` 
- `onboarding_analytics`
- `onboarding_uploads`

### 3. Test Database Connection

Create a simple test to verify your connection:

```sql
-- Test insert (will be cleaned up by triggers)
INSERT INTO onboarding_sessions (email, form_data) 
VALUES ('test@example.com', '{"test": true}');

-- Verify and clean up
SELECT * FROM onboarding_sessions WHERE email = 'test@example.com';
DELETE FROM onboarding_sessions WHERE email = 'test@example.com';
```

## Storage Setup (for file uploads)

### 1. Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket named `onboarding-uploads`
3. Make it **private** (not public)

### 2. Set Storage Policies

Run this SQL to set up storage policies:

```sql
-- Allow users to upload files for their sessions
CREATE POLICY "Users can upload files for their sessions" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'onboarding-uploads' 
  AND auth.role() = 'authenticated'
);

-- Allow users to view their own uploads
CREATE POLICY "Users can view their uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'onboarding-uploads'
  AND auth.role() = 'authenticated'
);

-- Allow service role full access
CREATE POLICY "Service role full access" ON storage.objects
FOR ALL USING (auth.role() = 'service_role');
```

## Row Level Security (RLS) Details

The schema includes comprehensive RLS policies:

### Sessions Table
- Users can only access sessions with their email
- Anonymous users can create sessions (for form start)
- Service role has full access

### Submissions Table  
- Users can read their own submissions
- Only service role can create/modify submissions
- Prevents data tampering

### Analytics Table
- Only service role access
- Protects user behavior data
- Enables admin reporting

### Uploads Table
- Users can manage uploads for their sessions
- Automatic cleanup when sessions expire

## Maintenance Functions

The schema includes automated maintenance:

### Cleanup Expired Sessions
```sql
-- Run manually or set up as a scheduled function
SELECT cleanup_expired_sessions();
```

### GDPR Anonymization
```sql
-- Anonymize data older than 36 months (customizable)
SELECT anonymize_old_submissions(36);
```

## Scheduled Maintenance (Optional)

Set up automated maintenance using Supabase Edge Functions:

1. Create an Edge Function for cleanup
2. Schedule it to run daily using cron
3. Monitor execution in logs

Example cron setup:
```sql
-- Clean up expired sessions daily at 2 AM
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 2 * * *',
  'SELECT cleanup_expired_sessions();'
);
```

## Performance Monitoring

### Key Indexes Created

- **Email lookups**: Fast session retrieval
- **Expiration queries**: Efficient cleanup
- **Analytics queries**: Quick reporting
- **File associations**: Fast upload management

### Query Performance Tips

1. **Always use email** for session lookups (indexed)
2. **Include session_id** for related data queries
3. **Use created_at ranges** for time-based analytics
4. **Limit result sets** for large analytics queries

## Security Considerations

### Data Protection
- All tables have RLS enabled
- Email verification prevents unauthorized access  
- File uploads are scanned and validated
- Personal data can be anonymized for GDPR

### Access Control
- **Anonymous users**: Can create sessions, verify email
- **Authenticated users**: Can access their own data
- **Service role**: Full access for API operations
- **Admin users**: Query through service role only

## Troubleshooting

### Common Issues

**RLS Policy Errors**:
- Check user authentication status
- Verify JWT contains correct email
- Ensure service role is used for admin operations

**Connection Issues**:
- Verify environment variables
- Check Supabase project status
- Confirm network connectivity

**Performance Issues**:  
- Monitor slow query log
- Check index usage with EXPLAIN
- Consider query optimization

### Debug Queries

```sql
-- Check RLS policy status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'onboarding_%';

-- View current user context
SELECT current_user, current_setting('role');

-- Check index usage
EXPLAIN ANALYZE SELECT * FROM onboarding_sessions WHERE email = 'test@example.com';
```

## Next Steps

After successful database setup:

1. ✅ Test environment connection
2. ✅ Verify RLS policies work
3. ✅ Test file upload storage
4. ➡️ **Proceed to Phase 2**: Core Architecture & State Management

## Schema Version

**Version**: 1.0.0  
**Created**: January 2025  
**Last Updated**: January 9, 2025

For schema changes, create migration files and document version history.