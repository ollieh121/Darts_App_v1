import { auth } from "@/auth";

export default auth((req) => {
  // Require a valid session with a user (stale/expired JWTs have no user)
  const isLoggedIn = !!req.auth?.user;
  const isScorerPage = req.nextUrl.pathname.startsWith("/scorer");

  if (isScorerPage && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  return;
});

export const config = {
  matcher: ["/scorer", "/scorer/:path*"],
};
