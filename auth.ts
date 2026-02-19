import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // Required for Vercel deployments
  session: {
    strategy: "jwt",
  },
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

        // Debug logging (remove in production if needed)
        if (!username || !password) {
          console.error("Auth credentials not configured in environment variables");
          return null;
        }

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isScorerPage = nextUrl.pathname.startsWith("/scorer");
      if (isScorerPage && !isLoggedIn) return false;
      return true;
    },
  },
});
