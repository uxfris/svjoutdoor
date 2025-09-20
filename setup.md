# Setup Instructions

## 1. Environment Configuration

Since `.env.example` is blocked by gitignore, please create a `.env.local` file manually with the following content:

```bash
# Supabase Configuration
# Get these values from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to Settings > API
3. Copy the Project URL and anon public key to your `.env.local` file
4. Copy the service_role key (keep this secret!) to your `.env.local` file

## 3. Database Setup

1. In your Supabase dashboard, go to SQL Editor
2. Run the SQL migrations from the `supabase/migrations/` folder in order:
   - 001_create_users_table.sql
   - 002_create_categories_table.sql
   - 003_create_products_table.sql
   - 004_create_members_table.sql
   - 005_create_suppliers_table.sql
   - 006_create_sales_table.sql
   - 007_create_sales_details_table.sql
   - 008_create_purchases_table.sql
   - 009_create_purchase_details_table.sql
   - 010_create_expenses_table.sql
   - 011_create_settings_table.sql
   - 012_create_stock_functions.sql

## 4. Run the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 5. Test the Setup

1. Visit `http://localhost:3000/test` to verify Supabase connection
2. Visit `http://localhost:3000/signup` to create your first admin user
3. Visit `http://localhost:3000/dashboard` to access the main application

## 6. Create Admin User

After running the migrations, you can create an admin user by:

1. Going to `http://localhost:3000/signup`
2. Registering with your email
3. In Supabase dashboard, go to Authentication > Users
4. Find your user and update the `level` field in the `users` table to `1` (for admin access)

## Troubleshooting

- If you get connection errors, double-check your Supabase credentials
- Make sure all migrations have been run successfully
- Check the browser console for any error messages
- Verify that RLS policies are enabled in Supabase
