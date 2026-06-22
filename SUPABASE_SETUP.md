# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Save your credentials:
   - Project URL
   - Anon Public Key
   - Service Role Key

## 2. Create the Registrations Table

In your Supabase dashboard, go to the SQL Editor and run this query:

```sql
-- Create registrations table
CREATE TABLE registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  photo_data TEXT, -- Base64 encoded image
  reg_number TEXT NOT NULL,
  is_parent BOOLEAN DEFAULT false,
  children JSONB, -- Array of child registrations if parent
  attendance_mode TEXT, -- 'physical' or 'facebook' for parents
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_registrations_created_at ON registrations(created_at DESC);
CREATE INDEX idx_registrations_category ON registrations(category);
CREATE INDEX idx_registrations_is_parent ON registrations(is_parent);
```

### If You Already Have the Table

If you already created the table without the `attendance_mode` column, add it with this query:

```sql
ALTER TABLE registrations ADD COLUMN attendance_mode TEXT;
```

## 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ADMIN_PASSWORD=your-secure-password
   ```

## 4. Update the Main App

The main registration form is still in `src/app/page.tsx`. You need to update the form submission to save to the database:

- Replace the local state management with API calls to `/api/registrations`
- The registration data will be automatically saved to Supabase

## 5. Access the Admin Dashboard

1. Run the app: `npm run dev`
2. Go to `http://localhost:3000/admin`
3. Log in with your admin password
4. View all registrations, statistics, and export data

## Features

- **Dashboard Stats**: Total registrations, students vs parents, breakdown by category
- **Live Table**: View all registrations with sorting and filtering options
- **CSV Export**: Download all registration data
- **Real-time Updates**: Refresh button to get latest data

## Security Notes

- The admin password should be strong and kept secret
- Service Role Key should only be used server-side (in API routes)
- Anon Key is safe to expose in the frontend (limited to public data)
- Implement additional authentication for production use

## Troubleshooting

- **"Connection refused"**: Check that SUPABASE_URL is correct
- **"Invalid API Key"**: Verify your ANON_KEY is correct
- **Can't access admin**: Ensure ADMIN_PASSWORD matches in `.env.local`
- **Database errors**: Check table structure matches the SQL schema above
