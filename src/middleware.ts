import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return Response.redirect(url);
    }
    if (role !== "ADMIN") {
      return Response.redirect(new URL("/formulario", req.nextUrl.origin));
    }
    return;
  }

  if (pathname.startsWith("/formulario") || pathname.startsWith("/api/pdf")) {
    if (!isLoggedIn) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return Response.redirect(url);
    }
  }
});

export const config = {
  matcher: ["/formulario/:path*", "/admin/:path*", "/api/pdf/:path*"],
};
