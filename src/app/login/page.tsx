"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6 text-center">
          VetFichas
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-[#1a1a1a]">
              Email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a1a1a]/20"
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-[#1a1a1a]">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a1a1a]/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="mt-2 bg-[#1a1a1a] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#333] transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </main>
  );
}
