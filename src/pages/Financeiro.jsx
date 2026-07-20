import { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { getFinanceiro, createDespesa, createEntrada } from "../lib/db";

function fmt(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const categoriasDespesa = [
  "Despesa operacional",
  "Combustível",
  "Manutenção",
  "Aluguel",
  "Funcionário",
  "Material de escritório",
  "Outro",
];

const categoriasEntrada = ["Venda de material", "Outro"];

export default function Financeiro() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("historico");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  function formatDateInput(date) {
    return date.toISOString().slice(0, 10);
  }

  function getPeriodoRange(tipo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (tipo === "ontem") {
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      return { inicio: ontem, fim: ontem };
    }

    if (tipo === "semana") {
      const inicio = new Date(hoje);
      const diaSemana = inicio.getDay();
      const deslocamento = diaSemana === 0 ? 6 : diaSemana - 1; // segunda-feira
      inicio.setDate(inicio.getDate() - deslocamento);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);
      return { inicio, fim };
    }

    return { inicio: hoje, fim: hoje };
  }

  function aplicarPeriodo(tipo) {
    const range = getPeriodoRange(tipo);
    setDataInicio(formatDateInput(range.inicio));
    setDataFim(formatDateInput(range.fim));
  }

  // Formulário despesa
  const [descDespesa, setDescDespesa] = useState("");
  const [valorDespesa, setValorDespesa] = useState("");
  const [catDespesa, setCatDespesa] = useState(categoriasDespesa[0]);
  const [salvandoDespesa, setSalvandoDespesa] = useState(false);

  // Formulário entrada
  const [descEntrada, setDescEntrada] = useState("");
  const [valorEntrada, setValorEntrada] = useState("");
  const [catEntrada, setCatEntrada] = useState(categoriasEntrada[0]);
  const [salvandoEntrada, setSalvandoEntrada] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const filtros = {};
      if (dataInicio) filtros.dataInicio = dataInicio;
      if (dataFim) filtros.dataFim = dataFim + "T23:59:59";
      const data = await getFinanceiro(filtros);
      setRegistros(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [dataInicio, dataFim]);

  const totalEntradas = registros
    .filter((r) => r.tipo === "entrada")
    .reduce((s, r) => s + Number(r.valor), 0);
  const totalSaidas = registros
    .filter((r) => r.tipo === "saida")
    .reduce((s, r) => s + Number(r.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  async function salvarDespesa() {
    if (!descDespesa || !valorDespesa) return;
    setSalvandoDespesa(true);
    try {
      await createDespesa({
        descricao: descDespesa,
        valor: parseFloat(valorDespesa),
        categoria: catDespesa,
      });
      setDescDespesa("");
      setValorDespesa("");
      carregar();
      setAbaAtiva("historico");
    } catch (e) {
      alert("Erro: " + e.message);
    } finally {
      setSalvandoDespesa(false);
    }
  }

  async function salvarEntrada() {
    if (!descEntrada || !valorEntrada) return;
    setSalvandoEntrada(true);
    try {
      await createEntrada({
        descricao: descEntrada,
        valor: parseFloat(valorEntrada),
        categoria: catEntrada,
      });
      setDescEntrada("");
      setValorEntrada("");
      carregar();
      setAbaAtiva("historico");
    } catch (e) {
      alert("Erro: " + e.message);
    } finally {
      setSalvandoEntrada(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Entradas</p>
          <p className="font-bold text-green-600 text-sm">
            {fmt(totalEntradas)}
          </p>
        </div>
        <div className="card p-3 text-center">
          <TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Saídas</p>
          <p className="font-bold text-red-600 text-sm">{fmt(totalSaidas)}</p>
        </div>
        <div className="card p-3 text-center">
          <DollarSign className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Saldo</p>
          <p
            className={`font-bold text-sm ${saldo >= 0 ? "text-indigo-600" : "text-red-600"}`}
          >
            {fmt(saldo)}
          </p>
        </div>
      </div>

      {/* Filtro de período */}
      <div className="card card-body space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => aplicarPeriodo("ontem")}
            className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Ontem
          </button>
          <button
            type="button"
            onClick={() => aplicarPeriodo("semana")}
            className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => {
              setDataInicio("");
              setDataFim("");
            }}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          >
            Limpar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-xs">De</label>
            <input
              type="date"
              className="input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="label text-xs">Até</label>
            <input
              type="date"
              className="input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "historico", label: "Histórico" },
          { id: "despesa", label: "+ Despesa" },
          { id: "entrada", label: "+ Entrada" },
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              abaAtiva === aba.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* Aba: Histórico */}
      {abaAtiva === "historico" && (
        <div className="card">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {registros.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-400">
                  Nenhum registro no período.
                </p>
              )}
              {registros.map((r) => (
                <div
                  key={r.id}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.descricao}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.categoria} ·{" "}
                      {new Date(r.data_hora).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${r.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}
                  >
                    {r.tipo === "entrada" ? "+" : "-"}
                    {fmt(r.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aba: Registrar despesa */}
      {abaAtiva === "despesa" && (
        <div className="card card-body space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm">
            Registrar despesa
          </h2>
          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={catDespesa}
              onChange={(e) => setCatDespesa(e.target.value)}
            >
              {categoriasDespesa.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              placeholder="Ex: Gasolina do caminhão"
              value={descDespesa}
              onChange={(e) => setDescDespesa(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input text-xl font-bold"
              placeholder="0.00"
              value={valorDespesa}
              onChange={(e) => setValorDespesa(e.target.value)}
            />
          </div>
          <button
            onClick={salvarDespesa}
            disabled={!descDespesa || !valorDespesa || salvandoDespesa}
            className="btn-danger w-full justify-center py-3"
          >
            {salvandoDespesa ? "Salvando..." : "Registrar Despesa"}
          </button>
        </div>
      )}

      {/* Aba: Registrar entrada */}
      {abaAtiva === "entrada" && (
        <div className="card card-body space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm">
            Registrar entrada
          </h2>
          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={catEntrada}
              onChange={(e) => setCatEntrada(e.target.value)}
            >
              {categoriasEntrada.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              placeholder="Ex: Venda de cobre para recicladora"
              value={descEntrada}
              onChange={(e) => setDescEntrada(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input text-xl font-bold"
              placeholder="0.00"
              value={valorEntrada}
              onChange={(e) => setValorEntrada(e.target.value)}
            />
          </div>
          <button
            onClick={salvarEntrada}
            disabled={!descEntrada || !valorEntrada || salvandoEntrada}
            className="btn-success w-full justify-center py-3"
          >
            {salvandoEntrada ? "Salvando..." : "Registrar Entrada"}
          </button>
        </div>
      )}
    </div>
  );
}
