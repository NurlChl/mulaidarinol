"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { submitPartnerApplication } from "@/app/actions/partner";
import { Loader2, CheckCircle2, AlertCircle, FileText, Globe, LogIn } from "lucide-react";
import Link from "next/link";

export function PartnerForm() {
  const { data: session, status } = useSession();
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioUrl || !experienceSummary) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await submitPartnerApplication({ portfolioUrl, experienceSummary });

      if (res.success) {
        setSuccess(true);
      } else {
        setErrorMsg(res.error || "Failed to submit application.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-48 items-center justify-center border border-border bg-card rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="border border-border bg-card rounded-lg p-8 text-center max-w-lg mx-auto">
        <LogIn className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Sign In to Apply</h3>
        <p className="text-sm text-muted-foreground mb-6">
          You must be logged in with a Google account to apply for the Partner Program and start creating roadmaps.
        </p>
        <Link
          href="/login?callbackUrl=/#partner"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-md transition-colors cursor-pointer"
        >
          Sign In with Google
        </Link>
      </div>
    );
  }

  if (session.user.role === "partner") {
    return (
      <div className="border border-border bg-card rounded-lg p-8 text-center max-w-lg mx-auto">
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">You are already a Partner!</h3>
        <p className="text-sm text-muted-foreground mb-6">
          You have full partner access. Head over to the CMS Dashboard to manage your roadmaps and materials.
        </p>
        <Link
          href="/cms"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-md transition-colors cursor-pointer"
        >
          Go to CMS Dashboard
        </Link>
      </div>
    );
  }

  if (session.user.role === "admin" || session.user.role === "superadmin") {
    return (
      <div className="border border-border bg-card rounded-lg p-8 text-center max-w-lg mx-auto">
        <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Administrative Access</h3>
        <p className="text-sm text-muted-foreground mb-6">
          As an administrator, you already have full dashboard capabilities. You do not need to apply as a partner.
        </p>
        <Link
          href="/cms"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-md transition-colors cursor-pointer"
        >
          Go to Admin CMS
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="border border-border bg-card rounded-lg p-8 text-center max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-1.5">Application Submitted!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Thank you for applying. Our administrators will review your portfolio and experience summary. You will receive an update on your account status soon.
        </p>
        <div className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded">
          Status: Pending Review
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card rounded-lg p-6 sm:p-8 max-w-lg mx-auto shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-1">Partner Application Form</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Submit your credentials. Admins will review your portfolio before granting access to roadmap tools.
      </p>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md animate-in fade-in duration-150">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="portfolio" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase mb-1.5">
            <Globe className="h-3.5 w-3.5" />
            <span>Portfolio URL / GitHub Link</span>
          </label>
          <input
            id="portfolio"
            type="url"
            required
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
            placeholder="https://myportfolio.dev"
          />
        </div>

        <div>
          <label htmlFor="experience" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase mb-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span>Experience & Motivation</span>
          </label>
          <textarea
            id="experience"
            required
            rows={4}
            value={experienceSummary}
            onChange={(e) => setExperienceSummary(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-y min-h-[80px]"
            placeholder="Tell us about your background, expertise, and why you want to create learning paths."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <span>Submit Application</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default PartnerForm;
