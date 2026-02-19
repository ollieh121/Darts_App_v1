import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = process.env.AUTH_CREDENTIALS_USERNAME;
        const password = process.env.AUTH_CREDENTIALS_PASSWORD;
        if (
          credentials?.username === username &&
          credentials?.password === password
        ) {
          return { id: "scorer", name: "Scorer" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isScorerPage = nextUrl.pathname.startsWith("/scorer");
      if (isScorerPage && !isLoggedIn) return false;
      return true;
    },
  },
});
