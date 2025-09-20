import Link from "next/link";

const routes = [
  { name: "Dashboard", href: "/dashboard", description: "Main dashboard" },
  { name: "Login", href: "/login", description: "User login" },
  { name: "Signup", href: "/signup", description: "User registration" },

  // Products
  { name: "Products", href: "/products", description: "Product management" },
  {
    name: "New Product",
    href: "/products/new",
    description: "Add new product",
  },
  {
    name: "Edit Product",
    href: "/products/1/edit",
    description: "Edit product (example)",
  },

  // Categories
  {
    name: "Categories",
    href: "/categories",
    description: "Category management",
  },
  {
    name: "New Category",
    href: "/categories/new",
    description: "Add new category",
  },
  {
    name: "Edit Category",
    href: "/categories/1/edit",
    description: "Edit category (example)",
  },

  // Members
  { name: "Members", href: "/members", description: "Customer members" },
  { name: "New Member", href: "/members/new", description: "Add new member" },
  {
    name: "Edit Member",
    href: "/members/1/edit",
    description: "Edit member (example)",
  },

  // Suppliers
  { name: "Suppliers", href: "/suppliers", description: "Supplier management" },
  {
    name: "New Supplier",
    href: "/suppliers/new",
    description: "Add new supplier",
  },
  {
    name: "Edit Supplier",
    href: "/suppliers/1/edit",
    description: "Edit supplier (example)",
  },

  // Sales
  { name: "Sales", href: "/sales", description: "Sales transactions" },
  {
    name: "Sale Detail",
    href: "/sales/1",
    description: "View sale details (example)",
  },
  { name: "POS", href: "/pos", description: "Point of sale" },

  // Purchases
  {
    name: "Purchases",
    href: "/purchases",
    description: "Purchase transactions",
  },
  {
    name: "New Purchase",
    href: "/purchases/new",
    description: "Add new purchase",
  },
  {
    name: "Purchase Detail",
    href: "/purchases/1",
    description: "View purchase details (example)",
  },

  // Expenses
  { name: "Expenses", href: "/expenses", description: "Business expenses" },
  {
    name: "New Expense",
    href: "/expenses/new",
    description: "Add new expense",
  },
  {
    name: "Edit Expense",
    href: "/expenses/1/edit",
    description: "Edit expense (example)",
  },

  // Reports
  { name: "Reports", href: "/reports", description: "Business reports" },

  // Users
  { name: "Users", href: "/users", description: "User management" },
  { name: "New User", href: "/users/new", description: "Add new user" },
  {
    name: "Edit User",
    href: "/users/1/edit",
    description: "Edit user (example)",
  },

  // Settings & Profile
  { name: "Settings", href: "/settings", description: "System settings" },
  { name: "Profile", href: "/profile", description: "User profile" },
];

export default function RoutesTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Route Test Page
        </h1>
        <p className="text-gray-600 mb-8">
          This page lists all available routes in the application. Click on any
          route to test it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="block p-6 bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {route.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{route.description}</p>
              <div className="text-blue-600 text-sm font-medium">
                {route.href} →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Test Instructions
          </h2>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>
              • Click on any route above to test if it loads without 404 errors
            </li>
            <li>
              • Routes that require authentication will redirect to /login
            </li>
            <li>
              • Some routes may show empty data if the database is not populated
            </li>
            <li>• Check the browser console for any JavaScript errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
