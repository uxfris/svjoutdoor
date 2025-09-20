"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Current user:", user);

      // Try to get all sales
      const { data, error } = await supabase
        .from("penjualan")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      console.log("Sales data:", data, "Error:", error);

      if (error) {
        setError(error.message);
      } else {
        setSales(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Sales</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Recent Sales</h2>
        {sales.length === 0 ? (
          <p>No sales found</p>
        ) : (
          <div className="space-y-2">
            {sales.map((sale) => (
              <div key={sale.id_penjualan} className="border p-2 rounded">
                <p>
                  <strong>ID:</strong> {sale.id_penjualan}
                </p>
                <p>
                  <strong>Total:</strong> Rp{" "}
                  {sale.total_harga?.toLocaleString()}
                </p>
                <p>
                  <strong>User ID:</strong> {sale.id_user}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(sale.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
