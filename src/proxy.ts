import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Next.js 16 Proxy convention: named export proxy function
export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  const isCmsRoute = nextUrl.pathname.startsWith("/cms");
  const isCmsLoginRoute = nextUrl.pathname === "/cms/login";
  
  if (isCmsRoute && !isCmsLoginRoute) {
    // If user is trying to access CMS pages but is not logged in, redirect to CMS portal login
    if (!isLoggedIn) {
      const loginUrl = new URL("/cms/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check role: must be partner, admin, or superadmin
    const userRole = req.auth?.user?.role;
    if (userRole === "user") {
      // Direct unauthorized public users back to home
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }
});

// Configure matchers for the proxy
export const config = {
  matcher: [
    "/cms/:path*",
  ],
};
