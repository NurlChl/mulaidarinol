"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Compass, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  useEffect(() => {
    if (error) {
      if (error === "OAuthSignin" || error === "OAuthCallback") {
        setErrorMsg("Failed to connect with Google. Please try again.");
      } else {
        setErrorMsg("An unexpected authentication error occurred.");
      }
    }
  }, [error]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to start Google sign-in. Please try again.");
      setLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex justify-center p-8 bg-card border border-border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-md hover:bg-muted text-sm font-semibold text-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      > 
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Decorative grids */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Compass className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">
              Dev<span className="text-primary">Roadmap</span>
            </span>
          </Link>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
            Track your roadmap learning progress, test your skills, and solve interactive coding exercises.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center p-8 bg-card border border-border rounded-lg shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        }>
          <LoginForm />
        </Suspense>


      </div>
    </div>
  );
}
