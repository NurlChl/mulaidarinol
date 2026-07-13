import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  const isCmsRoute = nextUrl.pathname.startsWith("/cms");
  const isCmsLoginRoute = nextUrl.pathname === "/cms/login";
  
  if (isCmsRoute && !isCmsLoginRoute) {
    // Redirect to CMS login if not logged in
    if (!isLoggedIn) {
      const loginUrl = new URL("/cms/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Role check: must be partner, admin, or superadmin
    const userRole = req.auth?.user?.role;
    if (userRole === "user") {
      // Direct unauthorized public users back to home
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/cms/:path*",
  ],
};
