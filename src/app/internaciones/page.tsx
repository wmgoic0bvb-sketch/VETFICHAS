import { AppShell } from "@/components/layout/app-shell";

export default function InternacionesPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#5c1838]">
          Internaciones
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#555]">
          Módulo de internaciones. Aquí podrás gestionar las estadías
          hospitalarias.
        </p>
      </main>
    </AppShell>
  );
}
