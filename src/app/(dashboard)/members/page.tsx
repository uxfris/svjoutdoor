"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { PrintService, PrintMemberCardData } from "@/lib/print-service";
import { useLoading } from "@/components/layout/LoadingContext";

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
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { setLoading: setGlobalLoading, endNavigation } = useLoading();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setGlobalLoading(true);
      const { data, error } = await supabase
        .from("member")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setGlobalLoading(false);
      endNavigation();
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

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center">
              <svg
                className="w-8 h-8 mr-3 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Member Management
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage customer members and their information
            </p>
          </div>
          <div className="flex space-x-3">
            {selectedMembers.length > 0 && (
              <>
                <button
                  onClick={handlePrintMemberCards}
                  disabled={printing}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <PrinterIcon className="w-5 h-5 mr-2" />
                  {printing
                    ? "Printing..."
                    : `Print Cards (${selectedMembers.length})`}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting === -1}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
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
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add New Member
            </Link>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Member Directory
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {members.length} {members.length === 1 ? "member" : "members"}{" "}
            registered
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={
                      selectedMembers.length === members.length &&
                      members.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr
                  key={member.id_member}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id_member)}
                      onChange={(e) =>
                        handleSelectMember(member.id_member, e.target.checked)
                      }
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-lg font-bold text-purple-600">
                          {member.nama.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {member.nama}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {member.kode_member}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">
                        {member.email || (
                          <span className="text-gray-400 italic">No email</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.telepon || (
                          <span className="text-gray-400 italic">No phone</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {member.alamat || (
                        <span className="text-gray-400 italic">No address</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Link
                        href={`/members/${member.id_member}/edit`}
                        className="inline-flex items-center px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-3 h-3 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() =>
                          handleDelete(member.id_member, member.nama)
                        }
                        disabled={deleting === member.id_member}
                        className="inline-flex items-center px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deleting === member.id_member ? (
                          <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                        ) : (
                          <TrashIcon className="w-3 h-3 mr-1" />
                        )}
                        Delete
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
  );
}
