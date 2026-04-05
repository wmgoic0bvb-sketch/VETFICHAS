import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    dni: string;
    role?: "user" | "admin";
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      dni: string;
      role: "user" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    dni?: string;
    role?: "user" | "admin";
  }
}
