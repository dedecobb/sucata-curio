import { useState, useEffect } from "react";
import { Plus, Pencil, Check, X, ToggleLeft, ToggleRight } from "lucide-react";
import {
  getMateriais,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "../lib/db";

function fmt(v) {
  return v ? `R$ ${Number(v).toFixed(2).replace(".", ",")}` : "—";
}

export default function Materiais() {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null); // id do item em edição
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [nomeAdd, setNomeAdd] = useState("");
  const [precoAdd, setPrecoAdd] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    setLoading(true);
    try {
      // Busca todos, incluindo inativos
      const { data, error } = await import("../lib/supabase").then((m) =>
        m.supabase.from("materiais").select("*").order("nome"),
      );
      if (error) throw error;
      setMateriais(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function adicionar() {
    if (!nomeAdd.trim()) return;
    setSalvando(true);
    setErro("");
    try {
      await createMaterial(
        nomeAdd.trim(),
        precoAdd ? parseFloat(precoAdd) : null,
      );
      setNomeAdd("");
      setPrecoAdd("");
      setAdicionando(false);
      carregar();
    } catch (e) {
      setErro("Erro ao adicionar: " + e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(id) {
    setSalvando(true);
    try {
      await updateMaterial(id, {
        nome: novoNome,
        preco_padrao_kg: novoPreco ? parseFloat(novoPreco) : null,
      });
      setEditando(null);
      carregar();
    } catch (e) {
      alert("Erro: " + e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function toggleAtivo(mat) {
    try {
      await updateMaterial(mat.id, { ativo: !mat.ativo });
      carregar();
    } catch (e) {
      alert("Erro: " + e.message);
    }
  }

  function iniciarEdicao(mat) {
    setEditando(mat.id);
    setNovoNome(mat.nome);
    setNovoPreco(mat.preco_padrao_kg ? String(mat.preco_padrao_kg) : "");
  }

  const ativos = materiais.filter((m) => m.ativo);
  const inativos = materiais.filter((m) => !m.ativo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Materiais</h1>
        <button onClick={() => setAdicionando(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Novo material
        </button>
      </div>

      {/* Formulário de novo material */}
      {adicionando && (
        <div className="card card-body space-y-3 border-2 border-indigo-200">
          <h2 className="font-semibold text-gray-700 text-sm">Novo material</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nome</label>
              <input
                autoFocus
                className="input"
                placeholder="Ex: Alumínio Puro"
                value={nomeAdd}
                onChange={(e) => setNomeAdd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
              />
            </div>
            <div>
              <label className="label">Preço padrão/kg (opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="Ex: 4.50"
                value={precoAdd}
                onChange={(e) => setPrecoAdd(e.target.value)}
              />
            </div>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button
              onClick={adicionar}
              disabled={!nomeAdd.trim() || salvando}
              className="btn-primary"
            >
              <Check className="w-4 h-4" />
              {salvando ? "Salvando..." : "Adicionar"}
            </button>
            <button
              onClick={() => {
                setAdicionando(false);
                setNomeAdd("");
                setPrecoAdd("");
                setErro("");
              }}
              className="btn-secondary"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de materiais ativos */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900 text-sm">
                Ativos ({ativos.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {ativos.map((mat) => (
                <div key={mat.id} className="px-4 py-3">
                  {editando === mat.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        autoFocus
                        className="input flex-1"
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="input w-28"
                        placeholder="R$/kg"
                        value={novoPreco}
                        onChange={(e) => setNovoPreco(e.target.value)}
                      />
                      <button
                        onClick={() => salvarEdicao(mat.id)}
                        className="btn-primary py-1.5"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="btn-secondary py-1.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {mat.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          Preço padrão: {fmt(mat.preco_padrao_kg)}/kg
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => iniciarEdicao(mat)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleAtivo(mat)}
                          className="p-1.5 text-green-500 hover:text-gray-400 transition-colors"
                          title="Desativar"
                        >
                          <ToggleRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Materiais inativos */}
          {inativos.length > 0 && (
            <div className="card opacity-60">
              <div className="card-header">
                <h2 className="font-semibold text-gray-500 text-sm">
                  Inativos ({inativos.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {inativos.map((mat) => (
                  <div
                    key={mat.id}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <p className="text-sm text-gray-400 line-through">
                      {mat.nome}
                    </p>
                    <button
                      onClick={() => toggleAtivo(mat)}
                      className="p-1.5 text-gray-300 hover:text-green-500 transition-colors"
                      title="Reativar"
                    >
                      <ToggleLeft className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
