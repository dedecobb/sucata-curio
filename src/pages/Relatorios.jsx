import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getComprasPorMaterial, getFinanceiro } from "../lib/db";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function fmt(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtKg(v) {
  return Number(v || 0).toFixed(1) + " kg";
}

const CORES = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const PERIODOS = [
  { label: "Hoje", dias: 0 },
  { label: "Esta semana", dias: 7 },
  { label: "Este mês", dias: 30 },
  { label: "Este ano", dias: 365 },
];

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodoRange(diasOrTipo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (diasOrTipo === "ontem") {
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const fim = new Date(ontem);
    fim.setHours(23, 59, 59, 999);
    return { inicio: ontem, fim };
  }

  if (diasOrTipo === 0) {
    const fim = new Date(hoje);
    fim.setHours(23, 59, 59, 999);
    return { inicio: hoje, fim };
  }

  if (diasOrTipo === 7) {
    const inicio = new Date(hoje);
    const diaSemana = inicio.getDay();
    const deslocamento = diaSemana === 0 ? 6 : diaSemana - 1;
    inicio.setDate(inicio.getDate() - deslocamento);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    fim.setHours(23, 59, 59, 999);
    return { inicio, fim };
  }

  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - (diasOrTipo - 1));
  const fim = new Date(hoje);
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState(1); // índice de PERIODOS
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [porMaterial, setPorMaterial] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [loading, setLoading] = useState(true);

  const aplicarPeriodo = (tipo) => {
    const range = getPeriodoRange(tipo);
    setDataInicio(formatDateInput(range.inicio));
    setDataFim(formatDateInput(range.fim));
    setPeriodo(null);
  };

  const moverSemana = (dias) => {
    const inicio = dataInicio
      ? new Date(dataInicio + "T00:00:00")
      : getPeriodoRange(7).inicio;
    const fim = dataFim
      ? new Date(dataFim + "T23:59:59")
      : getPeriodoRange(7).fim;

    inicio.setDate(inicio.getDate() + dias);
    fim.setDate(fim.getDate() + dias);

    setDataInicio(formatDateInput(inicio));
    setDataFim(formatDateInput(fim));
    setPeriodo(null);
  };

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const filtros = {};
        if (dataInicio) filtros.dataInicio = dataInicio + "T00:00:00";
        if (dataFim) filtros.dataFim = dataFim + "T23:59:59";
        if (!dataInicio && !dataFim) {
          const range = getPeriodoRange(PERIODOS[periodo].dias);
          filtros.dataInicio = range.inicio.toISOString();
          filtros.dataFim = range.fim.toISOString();
        }

        const [materiais, fin] = await Promise.all([
          getComprasPorMaterial(filtros),
          getFinanceiro(filtros),
        ]);
        setPorMaterial(materiais);
        setFinanceiro(fin);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [periodo, dataInicio, dataFim]);

  const totalEntradas = financeiro
    .filter((r) => r.tipo === "entrada")
    .reduce((s, r) => s + Number(r.valor), 0);
  const totalSaidas = financeiro
    .filter((r) => r.tipo === "saida")
    .reduce((s, r) => s + Number(r.valor), 0);
  const totalKgComprado = porMaterial.reduce(
    (s, m) => s + Number(m.totalKg),
    0,
  );

  const top5 = porMaterial.slice(0, 5);
  const entradasDetalhadas = financeiro.filter((r) => r.tipo === "entrada");

  const pieData = [
    { name: "Entradas", value: totalEntradas },
    { name: "Saídas", value: totalSaidas },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>

      {/* Seletor de período */}
      <div className="space-y-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {PERIODOS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setPeriodo(i);
                setDataInicio("");
                setDataFim("");
              }}
              className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                periodo === i && !dataInicio && !dataFim
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <button
            type="button"
            onClick={() => aplicarPeriodo(0)}
            className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Ontem
          </button>
          <button
            type="button"
            onClick={() => aplicarPeriodo(7)}
            className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Semana atual
          </button>
          <button
            type="button"
            onClick={() => moverSemana(-7)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Semana anterior
          </button>
          <button
            type="button"
            onClick={() => moverSemana(7)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Semana seguinte
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDataInicio("");
              setDataFim("");
              setPeriodo(1);
            }}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          >
            Limpar filtros
          </button>
          <div className="grid grid-cols-2 gap-3 flex-1 min-w-[240px]">
            <div>
              <label className="label text-xs">De</label>
              <input
                type="date"
                className="input"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value);
                  setPeriodo(null);
                }}
              />
            </div>
            <div>
              <label className="label text-xs">Até</label>
              <input
                type="date"
                className="input"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value);
                  setPeriodo(null);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <>
          {/* Resumo geral */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-3 text-center">
              <p className="text-xs text-gray-500">Gastos</p>
              <p className="font-bold text-red-600 text-sm mt-1">
                {fmt(totalSaidas)}
              </p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-gray-500">Receitas</p>
              <p className="font-bold text-green-600 text-sm mt-1">
                {fmt(totalEntradas)}
              </p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-gray-500">Resultado</p>
              <p
                className={`font-bold text-sm mt-1 ${totalEntradas - totalSaidas >= 0 ? "text-indigo-600" : "text-red-600"}`}
              >
                {fmt(totalEntradas - totalSaidas)}
              </p>
            </div>
            <div className="card p-3 text-center md:col-span-2 xl:col-span-1">
              <p className="text-xs text-gray-500">KG comprado</p>
              <p className="font-bold text-indigo-600 text-sm mt-1">
                {totalKgComprado.toFixed(1)} kg
              </p>
            </div>
          </div>

          {/* Gráfico de barras - top materiais por valor */}
          {top5.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-gray-900 text-sm">
                  Top materiais por valor pago
                </h2>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={top5}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="material" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v) => [fmt(v), "Total pago"]}
                      labelFormatter={(l) => l}
                    />
                    <Bar dataKey="totalReais" radius={[4, 4, 0, 0]}>
                      {top5.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico pizza entradas x saídas */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900 text-sm">
                Entradas vs Saídas
              </h2>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela de entradas detalhadas */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900 text-sm">
                Entradas detalhadas
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">
                      Descrição
                    </th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">
                      Categoria
                    </th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">
                      Data
                    </th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entradasDetalhadas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-sm text-gray-400"
                      >
                        Nenhuma entrada no período.
                      </td>
                    </tr>
                  ) : (
                    entradasDetalhadas.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 text-gray-700">
                          {r.descricao}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {r.categoria}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {new Date(r.data_hora).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-green-600">
                          {fmt(r.valor)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela detalhada por material */}
          {porMaterial.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-gray-900 text-sm">
                  Detalhe por material
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">
                        Material
                      </th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">
                        Peso total
                      </th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">
                        Valor pago
                      </th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">
                        Qtd recibos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {porMaterial.map((m, i) => (
                      <tr key={m.material}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: CORES[i % CORES.length] }}
                            />
                            {m.material}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {fmtKg(m.totalKg)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold">
                          {fmt(m.totalReais)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500">
                          {m.qtd}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {porMaterial.length === 0 && (
            <div className="card p-8 text-center text-gray-400 text-sm">
              Nenhum dado no período selecionado.
            </div>
          )}
        </>
      )}
    </div>
  );
}
