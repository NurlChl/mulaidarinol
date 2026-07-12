"use client";

import { useState } from "react";
import { updateUserRole } from "@/app/actions/cms";
import { User as UserIcon, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/ModalProvider";
import { SearchableSelect } from "./SearchableSelect";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "user" | "partner" | "admin" | "superadmin";
}

interface UserPartnerManagerProps {
  users: UserItem[];
}

export function UserPartnerManager({ users }: UserPartnerManagerProps) {
  const router = useRouter();
  const { showModal } = useModal();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: "user" | "partner" | "admin" | "superadmin") => {
    showModal({
      title: "Ubah Hak Akses User?",
      message: "Apakah Anda yakin ingin mengubah hak akses peran pengguna ini?",
      type: "warning",
      confirmText: "Ya, Ubah Peran",
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          setUpdatingId(userId);
          const res = await updateUserRole(userId, newRole);
          if (res.success) {
            router.refresh();
            showModal({
              title: "Berhasil",
              message: "Peran pengguna berhasil diperbarui.",
              type: "success",
            });
          } else {
            showModal({
              title: "Gagal Mengubah Peran",
              message: res.error || "Gagal mengubah role.",
              type: "error",
            });
          }
        } catch (err) {
          console.error(err);
          showModal({
            title: "Kesalahan Sistem",
            message: "Terjadi kesalahan internal. Coba beberapa saat lagi.",
            type: "error",
          });
        } finally {
          setUpdatingId(null);
        }
      }
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md">
            <UserIcon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Daftar Learner & Partner</h4>
            <p className="text-[10px] text-muted-foreground">Kelola hak akses pengguna reguler dan mitra kontributor platform.</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/45 font-semibold text-muted-foreground">
                <th className="p-4">Nama</th>
                <th className="p-4">Email</th>
                <th className="p-4">Peran (Role)</th>
                <th className="p-4 text-right">Ubah Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-semibold text-foreground">{user.name}</td>
                    <td className="p-4 text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        user.role === "partner"
                          ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {updatingId === user._id ? (
                        <Loader2 className="h-4 w-4 animate-spin inline-block text-primary" />
                      ) : (
                        <SearchableSelect
                          value={user.role}
                          onChange={(val) => handleRoleChange(user._id, val as any)}
                          options={[
                            { value: "user", label: "User / Learner" },
                            { value: "partner", label: "Partner" },
                          ]}
                          placeholder="Ubah Peran"
                          className="inline-block w-28 text-[10px]"
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserPartnerManager;
