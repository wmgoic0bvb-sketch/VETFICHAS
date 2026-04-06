import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    dni: string;
    role?: "user" | "admin" | "vet";
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      dni: string;
      role: "user" | "admin" | "vet";
      name: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    dni?: string;
    role?: "user" | "admin" | "vet";
    name?: string;
    picture?: string | null;
  }
}
