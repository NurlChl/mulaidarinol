"use client";

import { useState } from "react";
import { requestPasswordChangeOtp, verifyAndChangePassword, updateAdminEmail } from "@/app/actions/cms";
import { useSession } from "next-auth/react";
import { KeyRound, Mail, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CMSSettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  // Email form state
  const [email, setEmail] = useState(session?.user?.email || "");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // OTP flow state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setEmailLoading(true);
      setEmailSuccess(null);
      setEmailError(null);

      const res = await updateAdminEmail(email);
      if (res.success) {
        setEmailSuccess("Email berhasil diperbarui! Silakan refresh halaman atau login ulang.");
        await update({ email });
        router.refresh();
      } else {
        setEmailError(res.error || "Gagal memperbarui email.");
      }
    } catch (err) {
      console.error(err);
      setEmailError("Terjadi kesalahan sistem.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setPasswordError("Harap isi semua kolom kata sandi.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordSuccess(null);
      setPasswordError(null);

      const res = await requestPasswordChangeOtp();
      if (res.success) {
        setOtpSent(true);
        setPasswordSuccess("Kode verifikasi OTP telah dikirim ke email Anda.");
      } else {
        setPasswordError(res.error || "Gagal mengirimkan kode OTP.");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("Terjadi kesalahan sistem.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    try {
      setPasswordLoading(true);
      setPasswordSuccess(null);
      setPasswordError(null);

      const res = await verifyAndChangePassword(otpCode, password);
      if (res.success) {
        setPasswordSuccess("Kata sandi berhasil diperbarui! Gunakan sandi baru Anda pada login berikutnya.");
        setPassword("");
        setConfirmPassword("");
        setOtpCode("");
        setOtpSent(false);
      } else {
        setPasswordError(res.error || "Kode verifikasi salah atau kedaluwarsa.");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("Terjadi kesalahan sistem.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-xs">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Pengaturan Akun</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola email login Anda dan ganti kata sandi dengan aman menggunakan verifikasi email OTP.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Email Settings */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-primary" />
            <span>Ubah Alamat Email</span>
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">
            Ubah alamat email login untuk akun administrator atau partner Anda.
          </p>

          {emailSuccess && (
            <div className="mb-4 flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-md">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{emailSuccess}</span>
            </div>
          )}

          {emailError && (
            <div className="mb-4 flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Alamat Email Baru
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                placeholder="admin@mulaidarinol.com"
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {emailLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>Ubah Email</span>}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>Ubah Kata Sandi</span>
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">
            Demi keamanan, kode verifikasi sekali pakai (OTP) akan dikirimkan ke email terdaftar untuk menyetujui perubahan kata sandi.
          </p>

          {passwordSuccess && (
            <div className="mb-4 flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-md">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {!otpSent ? (
            // Form Request OTP
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                    Kata Sandi Baru
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
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {passwordLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Kirim Kode OTP Verifikasi</span>
                )}
              </button>
            </form>
          ) : (
            // Form Verify OTP
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-4 flex gap-3">
                <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">Verifikasi OTP Diperlukan</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    Masukkan 6 digit kode keamanan yang kami kirimkan ke email Anda untuk menyelesaikan perubahan kata sandi baru.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                  Kode OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-48 px-3 py-2 bg-background border border-border rounded-md text-sm font-bold tracking-widest text-center text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Verifikasi & Ubah Kata Sandi</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-muted rounded-md font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
