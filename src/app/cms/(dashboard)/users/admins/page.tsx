import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import AdminStaffManager from "@/components/AdminStaffManager";
import { ShieldAlert } from "lucide-react";

export default async function CMSAdminsPage() {
  const session = await auth();

  // Guard: Superadmin check
  if (!session || session.user.role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-xs">
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="font-bold text-foreground">Akses Terbatas (Superadmin Only)</h3>
        <p className="text-muted-foreground mt-1 max-w-xs">
          Hanya peran Superadmin utama yang dapat mengelola hak akses administrator dan mendaftarkan staff admin baru.
        </p>
      </div>
    );
  }

  await dbConnect();

  // Fetch only admins and superadmins
  const userDocs = await User.find({ role: { $in: ["admin", "superadmin"] } }).sort({ createdAt: -1 }).lean();

  const serializedUsers = userDocs.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Admin Staff Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola administrator internal platform dan daftarkan staff baru.
        </p>
      </div>

      <AdminStaffManager users={serializedUsers} />
    </div>
  );
}
