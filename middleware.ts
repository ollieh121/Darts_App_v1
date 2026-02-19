import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isScorerPage = req.nextUrl.pathname.startsWith("/scorer");

  if (isScorerPage && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  return;
});

export const config = {
  matcher: ["/scorer/:path*"],
};
