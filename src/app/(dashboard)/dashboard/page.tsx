import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return <div>Please log in to view the dashboard.</div>;
  }

  // Get user profile to check level
  const { data: userProfile } = await supabase
    .from("users")
    .select("level")
    .eq("id", authUser.id)
    .single();

  const isAdmin = userProfile?.level === 1;

  // Get dashboard statistics with optimized queries
  const baseQueries = [
    supabase.from("produk").select("*", { count: "exact", head: true }),
    supabase.from("penjualan").select("*", { count: "exact", head: true }),
  ];

  // Add members query only for administrators
  if (isAdmin) {
    baseQueries.push(
      supabase.from("member").select("*", { count: "exact", head: true })
    );
  }

  // Get recent sales with minimal data for better performance
  const recentSalesQuery = supabase
    .from("penjualan")
    .select(
      `
      id_penjualan,
      total_item,
      total_harga,
      created_at,
      member:nama
    `
    )
    .order("created_at", { ascending: false })
    .limit(5);

  const [countResults, { data: recentSales }] = await Promise.all([
    Promise.all(baseQueries),
    recentSalesQuery,
  ]);

  const [{ count: totalProducts }, { count: totalSales }, ...memberResult] =
    countResults;

  const { count: totalMembers } = isAdmin ? memberResult[0] : { count: 0 };

  const stats = [
    {
      name: "Total Products",
      value: totalProducts || 0,
      icon: "📦",
      color: "bg-blue-500",
    },
    {
      name: "Total Sales",
      value: totalSales || 0,
      icon: "💰",
      color: "bg-green-500",
    },
    // Only show member card for administrators
    ...(isAdmin
      ? [
          {
            name: "Total Members",
            value: totalMembers || 0,
            icon: "👥",
            color: "bg-purple-500",
          },
        ]
      : []),
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your point of sales system</p>
      </div>

      {/* Stats Grid */}
      <div
        className={`grid grid-cols-1 gap-6 mb-8 ${
          isAdmin ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div
                className={`${stat.color} rounded-lg p-3 text-white text-2xl`}
              >
                {stat.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentSales?.map((sale) => (
                <tr key={sale.id_penjualan}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{sale.id_penjualan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.member || "Walk-in Customer"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.total_item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rp {sale.total_harga.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
