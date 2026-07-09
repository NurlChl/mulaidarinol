import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import UserAdminManager from "@/components/UserAdminManager";
import { ShieldAlert } from "lucide-react";

export default async function CMSUsersPage() {
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
          Hanya peran Superadmin utama yang dapat mengelola hak akses user dan mendaftarkan administrator baru.
        </p>
      </div>
    );
  }

  await dbConnect();

  // Fetch all users
  const userDocs = await User.find().sort({ createdAt: -1 }).lean();

  const serializedUsers = userDocs.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Atur peran akun pengguna platform, berikan hak kontribusi, dan kelola staf admin internal.
        </p>
      </div>

      <UserAdminManager users={serializedUsers} />
    </div>
  );
}
