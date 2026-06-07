import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  CheckCircle,
  Printer,
  MessageCircle,
} from "lucide-react";
import { getMateriais, createCompra, getCompraById } from "../lib/db";
import { baixarPDF, compartilharWhatsApp } from "../lib/pdf";

function fmt(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const itemVazio = () => ({
  id: Date.now(),
  material_id: "",
  material_nome: "",
  peso_kg: "",
  preco_por_kg: "",
  valor_total: 0,
});

export default function NovaCompra() {
  const navigate = useNavigate();
  const [materiais, setMateriais] = useState([]);
  const [itens, setItens] = useState([itemVazio()]);
  const [clienteNome, setClienteNome] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [compraSalva, setCompraSalva] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getMateriais().then(setMateriais).catch(console.error);
  }, []);

  function atualizarItem(id, campo, valor) {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const atualizado = { ...item, [campo]: valor };

        // Atualiza nome se selecionou material do select
        if (campo === "material_id") {
          const mat = materiais.find((m) => m.id === valor);
          atualizado.material_nome = mat?.nome || "";
          if (mat?.preco_padrao_kg && !atualizado.preco_por_kg) {
            atualizado.preco_por_kg = String(mat.preco_padrao_kg);
          }
        }

        // Recalcula total
        const peso = parseFloat(atualizado.peso_kg) || 0;
        const preco = parseFloat(atualizado.preco_por_kg) || 0;
        atualizado.valor_total = peso * preco;

        return atualizado;
      }),
    );
  }

  function adicionarItem() {
    setItens((prev) => [...prev, itemVazio()]);
  }

  function removerItem(id) {
    if (itens.length === 1) return;
    setItens((prev) => prev.filter((i) => i.id !== id));
  }

  const totalGeral = itens.reduce((acc, i) => acc + i.valor_total, 0);

  const podeсалvar =
    itens.every(
      (i) =>
        i.material_nome.trim() &&
        parseFloat(i.peso_kg) > 0 &&
        parseFloat(i.preco_por_kg) > 0,
    ) && totalGeral > 0;

  async function salvarCompra() {
    if (!podeСалvar) return;
    setErro("");
    setSalvando(true);
    try {
      const payload = {
        cliente_nome: clienteNome || null,
        forma_pagamento: formaPagamento,
        observacoes: observacoes || null,
        itens: itens.map((i) => ({
          material_id: i.material_id || null,
          material_nome: i.material_nome,
          peso_kg: parseFloat(i.peso_kg),
          preco_por_kg: parseFloat(i.preco_por_kg),
          valor_total: i.valor_total,
        })),
      };
      const novaCompra = await createCompra(payload);
      // Busca compra completa com itens para o recibo
      const completa = await getCompraById(novaCompra.id);
      setCompraSalva(completa);
    } catch (e) {
      setErro("Erro ao salvar: " + e.message);
    } finally {
      setSalvando(false);
    }
  }

  // Corrigir o nome da função de validação
  const podeСалvar = podeCalvar;

  function podeCalvar() {
    return (
      itens.every(
        (i) =>
          i.material_nome.trim() &&
          parseFloat(i.peso_kg) > 0 &&
          parseFloat(i.preco_por_kg) > 0,
      ) && totalGeral > 0
    );
  }

  // ---- Tela de sucesso após salvar ----
  if (compraSalva) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="card p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">
            Compra registrada!
          </h2>
          <p className="text-gray-500 mt-1">
            Recibo #{String(compraSalva.numero_recibo).padStart(4, "0")} —{" "}
            {fmt(compraSalva.valor_total)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => baixarPDF(compraSalva)}
            className="btn-secondary justify-center py-3"
          >
            <Printer className="w-4 h-4" />
            Salvar PDF
          </button>
          <button
            onClick={() => compartilharWhatsApp(compraSalva)}
            className="btn-success justify-center py-3"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
        </div>

        <button
          onClick={() => {
            setCompraSalva(null);
            setItens([itemVazio()]);
            setClienteNome("");
            setObservacoes("");
          }}
          className="btn-primary w-full justify-center py-3"
        >
          <Plus className="w-4 h-4" />
          Nova compra
        </button>

        <button
          onClick={() => navigate("/compras")}
          className="btn-secondary w-full justify-center"
        >
          Ver histórico
        </button>
      </div>
    );
  }

  // ---- Formulário de compra ----
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Nova Compra</h1>

      {/* Dados do cliente */}
      <div className="card card-body space-y-3">
        <h2 className="font-semibold text-gray-700 text-sm">
          Dados (opcional)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nome do cliente</label>
            <input
              className="input"
              placeholder="Nome (opcional)"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pagamento</label>
            <select
              className="input"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
            >
              <option>Dinheiro</option>
              <option>Pix</option>
              <option>Transferência</option>
            </select>
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-700 text-sm">Materiais</h2>
          <button
            onClick={adicionarItem}
            className="btn-secondary text-xs py-1 px-2"
          >
            <Plus className="w-3 h-3" />
            Adicionar
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {itens.map((item, idx) => (
            <div key={item.id} className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-5">
                  {idx + 1}
                </span>
                {/* Select de material */}
                <select
                  className="input flex-1"
                  value={item.material_id}
                  onChange={(e) =>
                    atualizarItem(item.id, "material_id", e.target.value)
                  }
                >
                  <option value="">Selecionar...</option>
                  {materiais.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
                {/* Ou digitar manualmente */}
                {!item.material_id && (
                  <input
                    className="input w-32"
                    placeholder="Ou digite"
                    value={item.material_nome}
                    onChange={(e) =>
                      atualizarItem(item.id, "material_nome", e.target.value)
                    }
                  />
                )}
                <button
                  onClick={() => removerItem(item.id)}
                  disabled={itens.length === 1}
                  className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Peso e preço */}
              <div className="flex gap-2 ml-7">
                <div className="flex-1">
                  <label className="label text-xs">Peso (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.001"
                    min="0"
                    className="input text-lg font-bold"
                    placeholder="0.000"
                    value={item.peso_kg}
                    onChange={(e) =>
                      atualizarItem(item.id, "peso_kg", e.target.value)
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="label text-xs">R$/kg</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    className="input text-lg font-bold"
                    placeholder="0.00"
                    value={item.preco_por_kg}
                    onChange={(e) =>
                      atualizarItem(item.id, "preco_por_kg", e.target.value)
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="label text-xs">Total</label>
                  <div className="input bg-gray-50 text-lg font-bold text-indigo-600 cursor-default">
                    {fmt(item.valor_total)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observações */}
      <div className="card card-body">
        <label className="label">Observações</label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Anotações adicionais..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      {/* Total e salvar */}
      <div className="card p-4 flex items-center justify-between gap-4 sticky bottom-20 lg:bottom-4 shadow-lg">
        <div>
          <p className="text-xs text-gray-500">TOTAL A PAGAR</p>
          <p className="text-3xl font-bold text-gray-900">{fmt(totalGeral)}</p>
        </div>
        <button
          onClick={salvarCompra}
          disabled={!podeCalvar() || salvando}
          className="btn-primary py-4 px-8 text-base"
        >
          {salvando ? "Salvando..." : "Salvar Compra"}
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {erro}
        </div>
      )}
    </div>
  );
}
