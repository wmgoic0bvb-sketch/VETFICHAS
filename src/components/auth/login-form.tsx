"use client";

import { DbLoadingOverlay } from "@/components/ui/lottie-loading";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await signIn("credentials", {
        dni: dni.trim(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("DNI o contraseña incorrectos.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <DbLoadingOverlay show={pending} />
    <form onSubmit={onSubmit} className="relative flex flex-col gap-4">
      <div>
        <label
          htmlFor="dni"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#555]"
        >
          DNI
        </label>
        <input
          id="dni"
          name="dni"
          type="text"
          autoComplete="username"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          className="w-full rounded-lg border border-[#ddd] bg-white px-3 py-2 text-[15px] text-[#222] outline-none ring-[#2d6a4f]/30 focus:border-[#2d6a4f] focus:ring-2"
          required
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#555]"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[#ddd] bg-white px-3 py-2 text-[15px] text-[#222] outline-none ring-[#2d6a4f]/30 focus:border-[#2d6a4f] focus:ring-2"
          required
        />
      </div>
      {error ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-full bg-[#2d6a4f] py-2.5 text-sm font-medium text-white hover:bg-[#1b4332] disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
    </>
  );
}
