import { supabase } from "./supabase";

// ============================================================
// MATERIAIS
// ============================================================

export async function getMateriais() {
  const { data, error } = await supabase
    .from("materiais")
    .select("*")
    .eq("ativo", true)
    .order("nome");
  if (error) throw error;
  return data;
}

export async function createMaterial(nome, preco_padrao_kg = null) {
  const { data, error } = await supabase
    .from("materiais")
    .insert([{ nome, preco_padrao_kg }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMaterial(id, updates) {
  const { data, error } = await supabase
    .from("materiais")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMaterial(id) {
  const { error } = await supabase
    .from("materiais")
    .update({ ativo: false })
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// COMPRAS
// ============================================================

export async function getCompras({ dataInicio, dataFim, limit = 50 } = {}) {
  let query = supabase
    .from("compras")
    .select(
      `
      *,
      itens_compra (
        id,
        material_nome,
        peso_kg,
        preco_por_kg,
        valor_total
      )
    `,
    )
    .order("data_hora", { ascending: false })
    .limit(limit);

  if (dataInicio) query = query.gte("data_hora", dataInicio);
  if (dataFim) query = query.lte("data_hora", dataFim);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCompraById(id) {
  const { data, error } = await supabase
    .from("compras")
    .select(
      `
      *,
      itens_compra (*)
    `,
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createCompra({
  cliente_nome,
  forma_pagamento,
  observacoes,
  itens,
}) {
  // Calcula total
  const valor_total = itens.reduce((acc, item) => acc + item.valor_total, 0);

  // 1. Cria o cabeçalho da compra
  const { data: compra, error: errCompra } = await supabase
    .from("compras")
    .insert([{ cliente_nome, forma_pagamento, observacoes, valor_total }])
    .select()
    .single();

  if (errCompra) throw errCompra;

  // 2. Cria os itens vinculados à compra
  const itensParaInserir = itens.map((item) => ({
    compra_id: compra.id,
    material_id: item.material_id || null,
    material_nome: item.material_nome,
    peso_kg: item.peso_kg,
    preco_por_kg: item.preco_por_kg,
    valor_total: item.valor_total,
  }));

  const { error: errItens } = await supabase
    .from("itens_compra")
    .insert(itensParaInserir);

  if (errItens) throw errItens;

  // O trigger no banco já registra automaticamente no financeiro
  return compra;
}

export async function deleteCompra(id) {
  const { error } = await supabase.from("compras").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// FINANCEIRO
// ============================================================

export async function getFinanceiro({ dataInicio, dataFim } = {}) {
  let query = supabase
    .from("financeiro")
    .select("*")
    .order("data_hora", { ascending: false });

  if (dataInicio) query = query.gte("data_hora", dataInicio);
  if (dataFim) query = query.lte("data_hora", dataFim);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createDespesa({
  descricao,
  valor,
  categoria = "Despesa operacional",
}) {
  const { data, error } = await supabase
    .from("financeiro")
    .insert([
      {
        tipo: "saida",
        categoria,
        valor,
        descricao,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createEntrada({
  descricao,
  valor,
  categoria = "Venda de material",
}) {
  const { data, error } = await supabase
    .from("financeiro")
    .insert([
      {
        tipo: "entrada",
        categoria,
        valor,
        descricao,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// VENDAS
// ============================================================

export async function getVendas({ dataInicio, dataFim } = {}) {
  let query = supabase
    .from("vendas")
    .select("*")
    .order("data_hora", { ascending: false });

  if (dataInicio) query = query.gte("data_hora", dataInicio);
  if (dataFim) query = query.lte("data_hora", dataFim);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createVenda({
  material_nome,
  peso_kg,
  preco_por_kg,
  comprador,
  observacoes,
}) {
  const valor_total = peso_kg * preco_por_kg;

  const { data: venda, error: errVenda } = await supabase
    .from("vendas")
    .insert([
      {
        material_nome,
        peso_kg,
        preco_por_kg,
        valor_total,
        comprador,
        observacoes,
      },
    ])
    .select()
    .single();

  if (errVenda) throw errVenda;

  // Registra entrada no financeiro
  await createEntrada({
    descricao: `Venda: ${material_nome} - ${peso_kg}kg`,
    valor: valor_total,
    categoria: "Venda de material",
  });

  return venda;
}

// ============================================================
// RESUMO DO DIA / MÊS (para dashboard)
// ============================================================

export async function getResumoDia(data = new Date()) {
  const inicio = new Date(data);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(data);
  fim.setHours(23, 59, 59, 999);

  const { data: registros, error } = await supabase
    .from("financeiro")
    .select("tipo, valor")
    .gte("data_hora", inicio.toISOString())
    .lte("data_hora", fim.toISOString());

  if (error) throw error;

  const entradas = registros
    .filter((r) => r.tipo === "entrada")
    .reduce((s, r) => s + r.valor, 0);
  const saidas = registros
    .filter((r) => r.tipo === "saida")
    .reduce((s, r) => s + r.valor, 0);

  return { entradas, saidas, lucro: entradas - saidas };
}

export async function getResumoMes(
  ano = new Date().getFullYear(),
  mes = new Date().getMonth(),
) {
  const inicio = new Date(ano, mes, 1);
  const fim = new Date(ano, mes + 1, 0, 23, 59, 59, 999);

  const { data: registros, error } = await supabase
    .from("financeiro")
    .select("tipo, valor")
    .gte("data_hora", inicio.toISOString())
    .lte("data_hora", fim.toISOString());

  if (error) throw error;

  const entradas = registros
    .filter((r) => r.tipo === "entrada")
    .reduce((s, r) => s + r.valor, 0);
  const saidas = registros
    .filter((r) => r.tipo === "saida")
    .reduce((s, r) => s + r.valor, 0);

  return { entradas, saidas, lucro: entradas - saidas };
}

export async function getComprasPorMaterial({ dataInicio, dataFim } = {}) {
  let query = supabase
    .from("itens_compra")
    .select("material_nome, peso_kg, valor_total, compras!inner(data_hora)");

  if (dataInicio) query = query.gte("compras.data_hora", dataInicio);
  if (dataFim) query = query.lte("compras.data_hora", dataFim);

  const { data, error } = await query;
  if (error) throw error;

  // Agrupa por material
  const agrupado = {};
  for (const item of data) {
    if (!agrupado[item.material_nome]) {
      agrupado[item.material_nome] = {
        material: item.material_nome,
        totalKg: 0,
        totalReais: 0,
        qtd: 0,
      };
    }
    agrupado[item.material_nome].totalKg += Number(item.peso_kg);
    agrupado[item.material_nome].totalReais += Number(item.valor_total);
    agrupado[item.material_nome].qtd += 1;
  }

  return Object.values(agrupado).sort((a, b) => b.totalReais - a.totalReais);
}
