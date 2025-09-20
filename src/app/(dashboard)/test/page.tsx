"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Testing...");
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient();

        // Test basic connection
        const { data, error } = await supabase
          .from("kategori")
          .select("count")
          .limit(1);

        if (error) {
          setConnectionStatus(`Error: ${error.message}`);
        } else {
          setConnectionStatus("✅ Connected to Supabase successfully!");

          // Test table access
          const tableTests = [
            {
              name: "kategori",
              query: supabase.from("kategori").select("count").limit(1),
            },
            {
              name: "produk",
              query: supabase.from("produk").select("count").limit(1),
            },
            {
              name: "member",
              query: supabase.from("member").select("count").limit(1),
            },
            {
              name: "users",
              query: supabase.from("users").select("count").limit(1),
            },
          ];

          const results = await Promise.allSettled(
            tableTests.map((test) => test.query)
          );

          const accessibleTables = tableTests
            .filter((_, index) => results[index].status === "fulfilled")
            .map((test) => test.name);

          setTables(accessibleTables);
        }
      } catch (error: any) {
        setConnectionStatus(`Connection failed: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Supabase Connection Test
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Connection Status
              </h2>
              <p className="text-sm text-gray-600">{connectionStatus}</p>
            </div>

            {tables.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Accessible Tables
                </h2>
                <ul className="list-disc list-inside space-y-1">
                  {tables.map((table) => (
                    <li key={table} className="text-sm text-gray-600">
                      ✅ {table}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Next Steps:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>1. Set up your Supabase project</li>
                <li>
                  2. Run the SQL migrations in the supabase/migrations folder
                </li>
                <li>3. Update your .env.local with Supabase credentials</li>
                <li>4. Test the authentication flow</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
