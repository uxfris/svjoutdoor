# SVJ Outdoor - Point of Sales System

A modern point of sales system built with Next.js 15, TypeScript, TailwindCSS, and Supabase.

## Features

- 🛒 **Point of Sale Interface** - Modern POS with product search and cart management
- 📦 **Product Management** - Complete inventory management with categories
- 👥 **Member Management** - Customer database with membership tracking
- 🏪 **Supplier Management** - Vendor and purchase order management
- 📊 **Sales & Reports** - Comprehensive sales tracking and reporting
- 💰 **Purchase Management** - Inventory procurement and tracking
- 🔐 **Authentication** - Secure user authentication with role-based access
- 📱 **Responsive Design** - Mobile-first design that works on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Headless UI, Heroicons
- **State Management**: React Hooks
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <repository-url>
cd svjoutdoor
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL migrations in the `supabase/migrations/` folder in order
3. Enable Row Level Security (RLS) policies are included in the migrations

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- `users` - User accounts with role-based access
- `kategori` - Product categories
- `produk` - Product inventory
- `member` - Customer database
- `supplier` - Vendor information
- `penjualan` - Sales transactions
- `penjualan_detail` - Sales line items
- `pembelian` - Purchase transactions
- `pembelian_detail` - Purchase line items
- `pengeluaran` - Expense tracking
- `setting` - Application settings

## User Roles

- **Administrator (Level 1)**: Full access to all features
- **Cashier (Level 2)**: Limited to POS and basic operations

## API Routes

- `GET/POST /api/products` - Product management
- `GET/POST /api/sales` - Sales transactions
- `GET/POST /api/members` - Member management
- `GET/POST /api/categories` - Category management

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Development

### Code Style

- ESLint and Prettier are configured
- TypeScript strict mode enabled
- TailwindCSS for styling
- Component-based architecture

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── lib/                # Utility functions and configurations
│   └── supabase/       # Supabase client configurations
└── types/              # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
