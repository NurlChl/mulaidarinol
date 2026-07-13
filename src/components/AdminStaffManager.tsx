"use client";

import { useState } from "react";
import { updateUserRole, createNewAdmin } from "@/app/actions/cms";
import { UserPlus, Shield, Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/ModalProvider";
import { SearchableSelect } from "./SearchableSelect";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "user" | "partner" | "admin" | "superadmin";
}

interface AdminStaffManagerProps {
  users: UserItem[];
}

export function AdminStaffManager({ users }: AdminStaffManagerProps) {
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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Role modification state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredAdmins = users.filter((u) =>
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      title: "Ubah Hak Akses Admin?",
      message: "Apakah Anda yakin ingin mengubah hak akses peran administrator ini?",
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
              message: "Peran admin berhasil diperbarui.",
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
          <span>Daftarkan Staff Admin Baru</span>
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
              placeholder="e.g. jdoe@mulaidarinol.com"
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
            <input
              type="text"
              readOnly
              value="Admin"
              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-md text-xs text-muted-foreground cursor-not-allowed focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {formLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span>Daftarkan Staff</span>
            )}
          </button>
        </form>
      </div>

      {/* RIGHT: Admins Table */}
      <div className="lg:col-span-8 bg-card border border-border rounded-lg shadow-sm overflow-hidden space-y-4 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
          <h3 className="font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            <span>Staff Admin Platform</span>
          </h3>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="p-4">Nama</th>
                <th className="p-4">Email</th>
                <th className="p-4">Peran (Role)</th>
                <th className="p-4 text-right">Ubah Peran / Demote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAdmins.map((user) => (
                <tr key={user._id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 font-semibold text-foreground">{user.name}</td>
                  <td className="p-4 text-muted-foreground">{user.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      user.role === "superadmin"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {updatingId === user._id ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block text-primary" />
                    ) : user.role === "superadmin" ? (
                      <span className="text-muted-foreground text-[10px] italic">Owner Utama (Protected)</span>
                    ) : (
                      <SearchableSelect
                        value={user.role}
                        onChange={(val) => handleRoleChange(user._id, val as any)}
                        options={[
                          { value: "admin", label: "Admin" },
                          { value: "partner", label: "Demote to Partner" },
                          { value: "user", label: "Demote to Learner" },
                        ]}
                        placeholder="Ubah Peran"
                        className="inline-block w-28 text-[10px]"
                      />
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

export default AdminStaffManager;
