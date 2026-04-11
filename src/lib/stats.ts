import { Patient } from "@/models/patient";
import {
  aggregateControles,
  aggregateDemografia,
  aggregateEstudios,
  aggregateInternacion,
} from "@/lib/stats-aggregations";
import {
  DOW_LABELS,
  MES_RANGE,
  monthsBack,
  type Sucursal,
  type StatsFilters,
} from "@/lib/stats-utils";

export {
  SUCURSALES,
  computeEdadRango,
  normalizeFilters,
  shiftIsoDate,
  type Sucursal,
  type StatsFilters,
} from "@/lib/stats-utils";

export type DashboardStats = {
  filters: StatsFilters;
  kpis: {
    pacientesActivos: number;
    consultasEnRango: number;
    internadosAhora: number;
    asistenciaPct: number | null; // null si no hay datos
  };
  consultas: {
    porDiaSemana: Array<{ dow: number; label: string; count: number }>;
    porMes: Array<{ ym: string; count: number }>;
    porSucursal: Array<{ sucursal: string; count: number }>;
    porVeterinario: Array<{ veterinario: string; count: number }>;
    topMotivos: Array<{ motivo: string; count: number }>;
  };
  internacion: {
    topDiagnosticos: Array<{ diagnostico: string; count: number }>;
    topMedsInternacion: Array<{ medicamento: string; count: number }>;
    ingresosPorMes: Array<{ ym: string; count: number }>;
    mortalidadPct: number | null;
  };
  demografia: {
    porEspecie: Array<{ especie: string; count: number }>;
    porSexo: Array<{ sexo: string; count: number }>;
    porRangoEdad: Array<{ rango: string; count: number }>;
    altasPorMes: Array<{ ym: string; count: number }>;
  };
  estudios: {
    porCategoria: Array<{ categoria: string; count: number }>;
  };
};

type SucMatch = Record<string, unknown>;
function baseMatch(sucursal: Sucursal | null): SucMatch {
  return sucursal ? { sucursal } : {};
}

export async function computeDashboardStats(
  filters: StatsFilters,
): Promise<DashboardStats> {
  const base = baseMatch(filters.sucursal);
  const from = filters.from;
  const to = filters.to;
  const ymFrom = monthsBack(MES_RANGE);

  const [
    pacientesActivos,
    internadosAhora,
    consultasAgg,
    controlesAgg,
    internacionAgg,
    demografiaAgg,
    estudiosAgg,
  ] = await Promise.all([
    Patient.countDocuments({ ...base, estado: "activo" }),
    Patient.countDocuments({ ...base, internado: true }),
    aggregateConsultas(base, from, to, ymFrom),
    aggregateControles(base, from, to),
    aggregateInternacion(base, ymFrom),
    aggregateDemografia(base, ymFrom),
    aggregateEstudios(base, from, to),
  ]);

  return {
    filters,
    kpis: {
      pacientesActivos,
      consultasEnRango: consultasAgg.total,
      internadosAhora,
      asistenciaPct: controlesAgg.asistenciaPct,
    },
    consultas: {
      porDiaSemana: consultasAgg.porDiaSemana,
      porMes: consultasAgg.porMes,
      porSucursal: consultasAgg.porSucursal,
      porVeterinario: consultasAgg.porVeterinario,
      topMotivos: consultasAgg.topMotivos,
    },
    internacion: internacionAgg,
    demografia: demografiaAgg,
    estudios: estudiosAgg,
  };
}

async function aggregateConsultas(
  base: SucMatch,
  from: string,
  to: string,
  ymFrom: string,
) {
  const rows = await Patient.aggregate<{
    _id: { kind: string; key: string };
    count: number;
  }>([
    { $match: base },
    { $unwind: "$consultas" },
    {
      $addFields: {
        _fecha: { $substrCP: ["$consultas.fecha", 0, 10] },
      },
    },
    { $match: { _fecha: { $gte: from, $lte: to } } },
    {
      $facet: {
        dow: [
          {
            $group: {
              _id: { $dayOfWeek: { $dateFromString: { dateString: "$_fecha" } } },
              count: { $sum: 1 },
            },
          },
        ],
        mes: [
          { $match: { _fecha: { $gte: `${ymFrom}-01` } } },
          {
            $group: {
              _id: { $substrCP: ["$_fecha", 0, 7] },
              count: { $sum: 1 },
            },
          },
        ],
        sucursal: [
          { $group: { _id: "$sucursal", count: { $sum: 1 } } },
        ],
        vet: [
          { $group: { _id: "$consultas.veterinario", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        motivo: [
          {
            $group: {
              _id: {
                $toLower: { $ifNull: ["$consultas.motivo", ""] },
              },
              count: { $sum: 1 },
            },
          },
          { $match: { _id: { $ne: "" } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        total: [{ $count: "n" }],
      },
    },
  ]);

  const r = (rows[0] ?? {}) as unknown as {
    dow?: Array<{ _id: number; count: number }>;
    mes?: Array<{ _id: string; count: number }>;
    sucursal?: Array<{ _id: string | null; count: number }>;
    vet?: Array<{ _id: string; count: number }>;
    motivo?: Array<{ _id: string; count: number }>;
    total?: Array<{ n: number }>;
  };

  const dowMap = new Map((r.dow ?? []).map((x) => [x._id, x.count]));
  const porDiaSemana = Array.from({ length: 7 }, (_, i) => ({
    dow: i + 1,
    label: DOW_LABELS[i]!,
    count: dowMap.get(i + 1) ?? 0,
  }));

  return {
    total: r.total?.[0]?.n ?? 0,
    porDiaSemana,
    porMes: (r.mes ?? [])
      .map((x) => ({ ym: x._id, count: x.count }))
      .sort((a, b) => a.ym.localeCompare(b.ym)),
    porSucursal: (r.sucursal ?? []).map((x) => ({
      sucursal: x._id ?? "Sin sucursal",
      count: x.count,
    })),
    porVeterinario: (r.vet ?? [])
      .filter((x) => x._id && x._id.trim())
      .map((x) => ({ veterinario: x._id, count: x.count })),
    topMotivos: (r.motivo ?? []).map((x) => ({
      motivo: x._id,
      count: x.count,
    })),
  };
}
