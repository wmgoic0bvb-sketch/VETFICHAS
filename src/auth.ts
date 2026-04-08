import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        dni: { label: "DNI", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const { authorizeWithDniPassword } = await import(
          "@/lib/credentials-auth"
        );
        return authorizeWithDniPassword(credentials);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.dni = user.dni;
        token.role = user.role ?? "user";
        token.sucursal = user.sucursal ?? null;
        token.name = user.name ?? "";
        token.picture = user.image ?? undefined;
      }
      if (trigger === "update" && session) {
        const s = session as Record<string, unknown>;
        if (typeof s.name === "string") token.name = s.name;
        if (typeof s.picture === "string" || s.picture === null)
          token.picture = s.picture as string | null | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.dni = token.dni as string;
        session.user.role = token.role ?? "user";
        session.user.sucursal = token.sucursal ?? null;
        session.user.name =
          typeof token.name === "string" ? token.name : "";
        session.user.image =
          typeof token.picture === "string" ? token.picture : null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
