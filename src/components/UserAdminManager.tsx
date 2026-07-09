"use client";

import { useState } from "react";
import { updateUserRole, createNewAdmin } from "@/app/actions/cms";
import { UserPlus, Shield, User as UserIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/ModalProvider";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "user" | "partner" | "admin" | "superadmin";
}

interface UserAdminManagerProps {
  users: UserItem[];
}

export function UserAdminManager({ users }: UserAdminManagerProps) {
  const router = useRouter();
  const { showModal } = useModal();
  
  // Admin form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminRole, setAdminRole] = useState<"admin" | "superadmin">("admin");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Role modification state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setFormError("All fields are required.");
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      setFormSuccess(null);

      const res = await createNewAdmin({ name, email, password, role: adminRole });

      if (res.success) {
        setFormSuccess(`Administrator "${name}" berhasil terdaftar!`);
        setName("");
        setEmail("");
        setPassword("");
        router.refresh();
      } else {
        setFormError(res.error || "Gagal membuat administrator baru.");
      }
    } catch (err) {
      console.error(err);
      setFormError("An unexpected error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-xs">
      
      {/* LEFT: Create Admin Form */}
      <div className="lg:col-span-4 bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-primary" />
          <span>Daftarkan Admin Baru</span>
        </h3>
        <p className="text-[10px] text-muted-foreground mb-6">
          Tambahkan akun administrator baru yang bisa masuk menggunakan portal kredensial CMS.
        </p>

        {formSuccess && (
          <div className="mb-4 flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-md">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {formError && (
          <div className="mb-4 flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              placeholder="e.g. jdoe@devroadmap.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
              Pilih Peran (Role)
            </label>
            <select
              value={adminRole}
              onChange={(e) => setAdminRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {formLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span>Daftarkan Administrator</span>
            )}
          </button>
        </form>
      </div>

      {/* RIGHT: Users Table */}
      <div className="lg:col-span-8 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-secondary">
          <h3 className="font-bold uppercase tracking-wider text-foreground">
            Semua Pengguna Platform
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="p-4">Nama</th>
                <th className="p-4">Email</th>
                <th className="p-4">Peran (Role)</th>
                <th className="p-4 text-right">Ubah Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-semibold text-foreground">{user.name}</td>
                  <td className="p-4 text-muted-foreground">{user.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      user.role === "superadmin"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : user.role === "admin"
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        : user.role === "partner"
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
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value as any)}
                        className="px-2 py-1 bg-background border border-border rounded text-[10px] text-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="partner">Partner</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    )}
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

export default UserAdminManager;
