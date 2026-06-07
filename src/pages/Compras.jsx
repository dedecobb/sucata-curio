import { useState, useEffect } from "react";
import {
  Search,
  Printer,
  MessageCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getCompras, deleteCompra } from "../lib/db";
import { baixarPDF, compartilharWhatsApp } from "../lib/pdf";

function fmt(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [expandida, setExpandida] = useState(null);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      const filtros = {};
      if (dataInicio) filtros.dataInicio = dataInicio;
      if (dataFim) filtros.dataFim = dataFim + "T23:59:59";
      const data = await getCompras({ ...filtros, limit: 100 });
      setCompras(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [dataInicio, dataFim]);

  async function excluir(id) {
    if (
      !confirm(
        "Excluir esta compra? O registro financeiro também será removido.",
      )
    )
      return;
    try {
      await deleteCompra(id);
      setCompras((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert("Erro ao excluir: " + e.message);
    }
  }

  const filtradas = compras.filter((c) => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      String(c.numero_recibo).includes(b) ||
      (c.cliente_nome || "").toLowerCase().includes(b) ||
      c.itens_compra?.some((i) => i.material_nome.toLowerCase().includes(b))
    );
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Histórico de Compras</h1>

      {/* Filtros */}
      <div className="card card-body space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por recibo, cliente ou material..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
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

      {/* Contagem */}
      <p className="text-sm text-gray-500">
        {filtradas.length} {filtradas.length === 1 ? "compra" : "compras"}{" "}
        encontradas · Total:{" "}
        <strong>
          {fmt(filtradas.reduce((s, c) => s + Number(c.valor_total), 0))}
        </strong>
      </p>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.length === 0 && (
            <div className="card p-8 text-center text-gray-400 text-sm">
              Nenhuma compra encontrada.
            </div>
          )}
          {filtradas.map((compra) => (
            <div key={compra.id} className="card overflow-hidden">
              {/* Cabeçalho do card */}
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setExpandida(expandida === compra.id ? null : compra.id)
                }
              >
                <div className="flex items-center gap-3 text-left">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      #{String(compra.numero_recibo).padStart(4, "0")}
                      {compra.cliente_nome && (
                        <span className="text-gray-500 font-normal">
                          {" "}
                          — {compra.cliente_nome}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(compra.data_hora).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {compra.itens_compra?.length}{" "}
                      {compra.itens_compra?.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">
                    {fmt(compra.valor_total)}
                  </span>
                  {expandida === compra.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Detalhe expandido */}
              {expandida === compra.id && (
                <div className="border-t border-gray-100">
                  {/* Itens */}
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">
                          Material
                        </th>
                        <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">
                          Peso
                        </th>
                        <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">
                          R$/kg
                        </th>
                        <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {compra.itens_compra?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 font-medium">
                            {item.material_nome}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-600">
                            {Number(item.peso_kg).toFixed(3)} kg
                          </td>
                          <td className="px-4 py-2 text-right text-gray-600">
                            {fmt(item.preco_por_kg)}
                          </td>
                          <td className="px-4 py-2 text-right font-bold">
                            {fmt(item.valor_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {compra.observacoes && (
                    <p className="px-4 py-2 text-xs text-gray-500 italic border-t border-gray-100">
                      Obs: {compra.observacoes}
                    </p>
                  )}

                  {/* Ações */}
                  <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-wrap">
                    <button
                      onClick={() => baixarPDF(compra)}
                      className="btn-secondary text-xs py-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={() => compartilharWhatsApp(compra)}
                      className="btn-success text-xs py-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => excluir(compra.id)}
                      className="btn-danger text-xs py-1.5 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
