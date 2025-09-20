"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { PrintService, PrintMemberCardData } from "@/lib/print-service";

interface Member {
  id_member: number;
  kode_member: string;
  nama: string;
  email: string | null;
  telepon: string | null;
  alamat: string | null;
  created_at: string;
  updated_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("member")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete member "${name}"?`)) {
      return;
    }

    setDeleting(id);
    setError("");

    try {
      const { error } = await supabase
        .from("member")
        .delete()
        .eq("id_member", id);

      if (error) throw error;

      // Reload members
      await loadMembers();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map((m) => m.id_member));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, id]);
    } else {
      setSelectedMembers(selectedMembers.filter((m) => m !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMembers.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedMembers.length} selected members?`
      )
    ) {
      return;
    }

    setDeleting(-1);
    setError("");

    try {
      const { error } = await supabase
        .from("member")
        .delete()
        .in("id_member", selectedMembers);

      if (error) throw error;

      setSelectedMembers([]);
      await loadMembers();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handlePrintMemberCards = async () => {
    if (selectedMembers.length === 0) {
      alert("Please select members to print cards");
      return;
    }

    setPrinting(true);
    setError("");

    try {
      const selectedMembersData = members
        .filter((m) => selectedMembers.includes(m.id_member))
        .map((m) => ({
          id_member: m.id_member,
          kode_member: m.kode_member,
          nama: m.nama,
          telepon: m.telepon || "",
          alamat: m.alamat || "",
        }));

      await PrintService.printMemberCards(selectedMembersData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-600">Manage customer members</p>
          </div>
          <div className="flex space-x-2">
            {selectedMembers.length > 0 && (
              <>
                <button
                  onClick={handlePrintMemberCards}
                  disabled={printing}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <PrinterIcon className="w-5 h-5 mr-2" />
                  {printing
                    ? "Printing..."
                    : `Print Cards (${selectedMembers.length})`}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting === -1}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <TrashIcon className="w-5 h-5 mr-2" />
                  {deleting === -1
                    ? "Deleting..."
                    : `Delete (${selectedMembers.length})`}
                </button>
              </>
            )}
            <Link
              href="/members/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add New Member
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Member List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedMembers.length === members.length &&
                        members.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id_member}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id_member)}
                        onChange={(e) =>
                          handleSelectMember(member.id_member, e.target.checked)
                        }
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.telepon || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.alamat || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Link
                          href={`/members/${member.id_member}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(member.id_member, member.nama)
                          }
                          disabled={deleting === member.id_member}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deleting === member.id_member ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
