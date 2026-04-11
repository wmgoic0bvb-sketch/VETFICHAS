import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    dni: string;
    role?: "user" | "admin" | "vet";
    sucursal?: "AVENIDA" | "VILLEGAS" | "MITRE" | null;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      dni: string;
      role: "user" | "admin" | "vet";
      name: string;
      sucursal?: "AVENIDA" | "VILLEGAS" | "MITRE" | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    dni?: string;
    role?: "user" | "admin" | "vet";
    sucursal?: "AVENIDA" | "VILLEGAS" | "MITRE" | null;
    name?: string;
    picture?: string | null;
  }
}
