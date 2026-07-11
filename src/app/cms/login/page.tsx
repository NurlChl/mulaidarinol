"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function CMSLoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/cms";

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.role === "user") {
        router.replace("/");
      } else {
        router.replace(callbackUrl);
      }
    }
  }, [status, session, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg(
          res.code === "database_unavailable"
            ? "Database sedang tidak bisa dihubungi. Cek koneksi MongoDB/Atlas lalu coba lagi."
            : "Invalid email or password."
        );
        setLoading(false);
      } else {
        // Immediate redirect to bypass NextAuth session status propagation delay
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && session.user.role !== "user")) {
    return (
      <div className="flex justify-center p-8 bg-card border border-border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md animate-in fade-in slide-in-from-top-1 duration-150">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
            placeholder="admin@devroadmap.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Sign In to Dashboard</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function CMSLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center mb-6">
            <img
              src="/MulaiDariNol.svg"
              alt="MulaiDariNol Logo"
              className="h-10 w-auto dark:brightness-0 dark:invert transition-all"
            />
          </Link>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20 rounded mb-2">
            CMS Portal
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Sign in as Administrator / Partner
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Log in with your administrator credentials to manage roadmaps, quizzes, and applications.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center p-8 bg-card border border-border rounded-lg shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        }>
          <CMSLoginForm />
        </Suspense>

        <div className="text-center text-xs text-muted-foreground">
          <span>Are you a student or public learner? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in with Google here
          </Link>
        </div>
      </div>
    </div>
  );
}
