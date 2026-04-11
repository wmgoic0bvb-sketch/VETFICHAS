import { Patient } from "@/models/patient";
import { computeEdadRango } from "@/lib/stats-utils";

type SucMatch = Record<string, unknown>;

export async function aggregateControles(
  base: SucMatch,
  from: string,
  to: string,
): Promise<{ asistenciaPct: number | null }> {
  const rows = await Patient.aggregate<{
    _id: null;
    total: number;
    asistidos: number;
  }>([
    { $match: base },
    { $unwind: "$proximosControles" },
    {
      $addFields: {
        _fecha: { $substrCP: ["$proximosControles.fechaHora", 0, 10] },
      },
    },
    { $match: { _fecha: { $gte: from, $lte: to } } },
    { $match: { "proximosControles.asistencia": { $ne: null } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        asistidos: {
          $sum: {
            $cond: [
              { $eq: ["$proximosControles.asistencia", true] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const r = rows[0];
  if (!r || r.total === 0) return { asistenciaPct: null };
  return { asistenciaPct: Math.round((r.asistidos / r.total) * 100) };
}

export async function aggregateInternacion(base: SucMatch, ymFrom: string) {
  const rows = await Patient.aggregate([
    { $match: base },
    { $unwind: "$historialInternaciones" },
    {
      $facet: {
        diagnosticos: [
          {
            $group: {
              _id: "$historialInternaciones.diagnosticoPrincipal",
              count: { $sum: 1 },
            },
          },
          { $match: { _id: { $nin: [null, ""] } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        meds: [
          { $unwind: "$historialInternaciones.ordenes" },
          {
            $group: {
              _id: "$historialInternaciones.ordenes.medicamentoOProcedimiento",
              count: { $sum: 1 },
            },
          },
          { $match: { _id: { $nin: [null, ""] } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        ingresosMes: [
          {
            $addFields: {
              _ym: {
                $substrCP: ["$historialInternaciones.fechaIngreso", 0, 7],
              },
            },
          },
          { $match: { _ym: { $gte: ymFrom } } },
          { $group: { _id: "$_ym", count: { $sum: 1 } } },
        ],
        egresos: [
          {
            $group: {
              _id: "$historialInternaciones.tipoEgreso",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const r = (rows[0] ?? {}) as {
    diagnosticos?: Array<{ _id: string; count: number }>;
    meds?: Array<{ _id: string; count: number }>;
    ingresosMes?: Array<{ _id: string; count: number }>;
    egresos?: Array<{ _id: string | null; count: number }>;
  };

  let totalEgresos = 0;
  let fallecimientos = 0;
  for (const e of r.egresos ?? []) {
    totalEgresos += e.count;
    if (e._id === "fallecimiento") fallecimientos += e.count;
  }

  return {
    topDiagnosticos: (r.diagnosticos ?? []).map((x) => ({
      diagnostico: x._id,
      count: x.count,
    })),
    topMedsInternacion: (r.meds ?? []).map((x) => ({
      medicamento: x._id,
      count: x.count,
    })),
    ingresosPorMes: (r.ingresosMes ?? [])
      .map((x) => ({ ym: x._id, count: x.count }))
      .sort((a, b) => a.ym.localeCompare(b.ym)),
    mortalidadPct:
      totalEgresos === 0
        ? null
        : Math.round((fallecimientos / totalEgresos) * 100),
  };
}

export async function aggregateDemografia(base: SucMatch, ymFrom: string) {
  const rows = await Patient.aggregate([
    { $match: { ...base, estado: "activo" } },
    {
      $facet: {
        especie: [{ $group: { _id: "$especie", count: { $sum: 1 } } }],
        sexo: [
          {
            $group: {
              _id: { $ifNull: ["$sexo", ""] },
              count: { $sum: 1 },
            },
          },
        ],
        fnacs: [{ $project: { fnac: 1 } }],
        altas: [
          {
            $addFields: {
              _ym: {
                $dateToString: { format: "%Y-%m", date: "$createdAt" },
              },
            },
          },
          { $match: { _ym: { $gte: ymFrom } } },
          { $group: { _id: "$_ym", count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  const r = (rows[0] ?? {}) as {
    especie?: Array<{ _id: string; count: number }>;
    sexo?: Array<{ _id: string; count: number }>;
    fnacs?: Array<{ fnac: string }>;
    altas?: Array<{ _id: string; count: number }>;
  };

  const rangoCounts = new Map<string, number>();
  for (const p of r.fnacs ?? []) {
    const rango = computeEdadRango(p.fnac ?? "");
    rangoCounts.set(rango, (rangoCounts.get(rango) ?? 0) + 1);
  }
  const rangoOrder = [
    "< 1 año",
    "1-2 años",
    "3-6 años",
    "7-10 años",
    "> 10 años",
    "Sin dato",
  ];

  return {
    porEspecie: (r.especie ?? []).map((x) => ({
      especie: x._id,
      count: x.count,
    })),
    porSexo: (r.sexo ?? []).map((x) => ({
      sexo: x._id || "Sin dato",
      count: x.count,
    })),
    porRangoEdad: rangoOrder
      .filter((r) => rangoCounts.has(r))
      .map((r) => ({ rango: r, count: rangoCounts.get(r)! })),
    altasPorMes: (r.altas ?? [])
      .map((x) => ({ ym: x._id, count: x.count }))
      .sort((a, b) => a.ym.localeCompare(b.ym)),
  };
}

export async function aggregateEstudios(
  base: SucMatch,
  from: string,
  to: string,
) {
  const rows = await Patient.aggregate<{ _id: string; count: number }>([
    { $match: base },
    { $unwind: "$estudios" },
    {
      $addFields: {
        _fecha: { $substrCP: ["$estudios.fecha", 0, 10] },
      },
    },
    { $match: { _fecha: { $gte: from, $lte: to } } },
    { $group: { _id: "$estudios.categoria", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return {
    porCategoria: rows.map((x) => ({
      categoria: x._id || "Sin categoría",
      count: x.count,
    })),
  };
}
