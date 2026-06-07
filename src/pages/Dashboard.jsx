import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Clock,
} from "lucide-react";
import { getResumoDia, getResumoMes, getCompras } from "../lib/db";

function fmt(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function MetricCard({ label, valor, icon: Icon, cor, sub }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${cor}`}>{fmt(valor)}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div
          className={`p-2 rounded-lg ${cor === "text-green-600" ? "bg-green-50" : cor === "text-red-600" ? "bg-red-50" : "bg-indigo-50"}`}
        >
          <Icon className={`w-5 h-5 ${cor}`} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [resumoDia, setResumoDia] = useState({
    entradas: 0,
    saidas: 0,
    lucro: 0,
  });
  const [resumoMes, setResumoMes] = useState({
    entradas: 0,
    saidas: 0,
    lucro: 0,
  });
  const [ultimasCompras, setUltimasCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [dia, mes, compras] = await Promise.all([
          getResumoDia(),
          getResumoMes(),
          getCompras({ limit: 5 }),
        ]);
        setResumoDia(dia);
        setResumoMes(mes);
        setUltimasCompras(compras);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 capitalize">{hoje}</p>
        </div>
        <Link to="/nova-compra" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nova Compra
        </Link>
      </div>

      {/* Métricas do dia */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Hoje
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard
            label="Gasto hoje"
            valor={resumoDia.saidas}
            icon={TrendingDown}
            cor="text-red-600"
            sub="Compras de sucata"
          />
          <MetricCard
            label="Receita hoje"
            valor={resumoDia.entradas}
            icon={TrendingUp}
            cor="text-green-600"
            sub="Vendas"
          />
          <MetricCard
            label="Resultado hoje"
            valor={resumoDia.lucro}
            icon={DollarSign}
            cor={resumoDia.lucro >= 0 ? "text-indigo-600" : "text-red-600"}
          />
        </div>
      </div>

      {/* Métricas do mês */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {new Date().toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard
            label="Gasto no mês"
            valor={resumoMes.saidas}
            icon={ShoppingCart}
            cor="text-red-600"
          />
          <MetricCard
            label="Receita no mês"
            valor={resumoMes.entradas}
            icon={TrendingUp}
            cor="text-green-600"
          />
          <MetricCard
            label="Resultado do mês"
            valor={resumoMes.lucro}
            icon={DollarSign}
            cor={resumoMes.lucro >= 0 ? "text-indigo-600" : "text-red-600"}
          />
        </div>
      </div>

      {/* Últimas compras */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Últimas compras</h2>
          </div>
          <Link
            to="/compras"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Ver todas
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {ultimasCompras.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">
              Nenhuma compra registrada ainda.
              <br />
              <Link
                to="/nova-compra"
                className="text-indigo-600 font-medium hover:underline"
              >
                Registrar primeira compra
              </Link>
            </div>
          )}
          {ultimasCompras.map((compra) => (
            <div
              key={compra.id}
              className="px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Recibo #{String(compra.numero_recibo).padStart(4, "0")}
                  {compra.cliente_nome && (
                    <span className="text-gray-500 font-normal">
                      {" "}
                      — {compra.cliente_nome}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(compra.data_hora).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {compra.itens_compra?.length || 0}{" "}
                  {compra.itens_compra?.length === 1 ? "item" : "itens"}
                </p>
              </div>
              <span className="font-bold text-gray-900">
                {fmt(compra.valor_total)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
