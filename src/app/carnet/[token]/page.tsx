import Image from "next/image";
import { notFound } from "next/navigation";
import { CarnetEventoCard } from "@/components/carnet/carnet-evento-card";
import { ZOOVET_FOOTER_BRANCHES } from "@/lib/clinic-branding";
import { getCarnetPublicoPorToken } from "@/lib/carnet-public";
import { CARNET_PAW_PATTERN_BACKGROUND } from "@/lib/paw-pattern-background";
import { formatFecha } from "@/lib/date-utils";

const C = {
  primary: "#8B1A4A",
  card: "#FFFFFF",
  ink: "#1A1A1A",
  muted: "#5C5C5C",
  footer: "#6B1238",
  line: "rgba(139, 26, 74, 0.2)",
} as const;

function emojiEspecie(especie: string): string | null {
  const e = especie.trim().toLowerCase();
  if (e === "gato") return "🐱";
  if (e === "perro") return "🐕";
  return null;
}

function fechaConsultaLabel(raw: string): string {
  const f = formatFecha(raw);
  if (f !== "—") return f;
  const t = raw.trim();
  return t || "—";
}

type Props = { params: Promise<{ token: string }> };

export default async function CarnetPublicPage({ params }: Props) {
  const { token } = await params;
  const data = await getCarnetPublicoPorToken(token);
  if (!data) notFound();

  const { paciente, eventos } = data;
  const especieEmoji = emojiEspecie(paciente.especie);

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden"
      style={CARNET_PAW_PATTERN_BACKGROUND}
    >
      <div className="relative z-[1] flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 pb-10 sm:px-6 sm:py-10">
        <header className="flex flex-col items-center text-center">
          <Image
            src="/logo_zoovet_colors.png"
            alt="Zoovet centro veterinario"
            width={320}
            height={140}
            className="h-auto w-full max-w-[min(100%,20rem)] object-contain object-center"
            priority
          />
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-3xl">
            Carnet de vacunación
          </h1>
        </header>

        <div
          className="mx-auto mt-10 max-w-md"
          style={{ height: 2, backgroundColor: C.line }}
          aria-hidden
        />

        <section
          aria-labelledby="patient-heading"
          className="mt-10 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          style={{ backgroundColor: C.card }}
        >
          <h2 id="patient-heading" className="sr-only">
            Datos del paciente
          </h2>
          {/* TODO: cuando exista foto del paciente en datos públicos, mostrarla aquí en lugar del emoji. */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {especieEmoji ? (
              <span
                className="shrink-0 text-3xl leading-none sm:text-4xl"
                role="img"
                aria-label={paciente.especie}
              >
                {especieEmoji}
              </span>
            ) : null}
            <p
              className="text-center text-3xl font-bold capitalize leading-tight sm:text-[2rem]"
              style={{ color: C.ink }}
            >
              {paciente.nombre}
            </p>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="vacunas-heading">
          <h2
            id="vacunas-heading"
            className="mb-6 text-center text-sm font-bold uppercase tracking-[0.12em] text-[#8B1A4A]"
          >
            Vacunas registradas
          </h2>

          {eventos.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed border-[#B0B0B0]/50 p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:p-8"
              style={{ backgroundColor: C.card }}
              role="status"
            >
              <p className="font-semibold" style={{ color: C.muted }}>
                Aún no hay consultas de vacunación cargadas.
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: C.muted }}>
                Cuando el equipo registre una vacunación, aparecerá aquí con la
                fecha correspondiente.
              </p>
            </div>
          ) : (
            <ol className="space-y-6">
              {eventos.map((ev, i) => (
                <CarnetEventoCard
                  key={`${ev.fecha}-${i}`}
                  evento={ev}
                  fechaAplicacion={fechaConsultaLabel(ev.fecha)}
                />
              ))}
            </ol>
          )}
        </section>
      </main>

      <footer
        className="mt-auto w-full px-4 py-8 text-white sm:px-8"
        style={{ backgroundColor: C.footer }}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center sm:grid-cols-3 sm:gap-6 sm:text-left">
          {ZOOVET_FOOTER_BRANCHES.map((b) => (
            <div key={b.address}>
              <p className="text-sm font-normal text-white/90">{b.address}</p>
              <p className="mt-1 text-base font-bold">Tel. {b.phone}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-white/85">
          <a
            href="https://zoovet.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline decoration-white/40 underline-offset-2 transition hover:text-white"
          >
            zoovet.ar
          </a>
        </p>
      </footer>
      </div>
    </div>
  );
}
