import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "./supabase";

const EMPRESA_PADRAO = {
  nome: "Sucata Curió",
  telefone: "(65) 99264-4949",
  endereco: "Av. Agrícola Paes de Barros, Nº 1632",
  bairro: "Bairro Porto - Cuiabá/MT",
  cnpj: "65.276.996/0001-08",
  logo_url: "/logo_sucata.jpeg",
};

async function buscarEmpresa(compra) {
  let query = supabase
    .from("companies")
    .select("nome, telefone, endereco, bairro, cnpj, logo_url");

  if (compra?.company_id) {
    query = query.eq("id", compra.company_id);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error || !data) return EMPRESA_PADRAO;

  return {
    ...EMPRESA_PADRAO,
    ...Object.fromEntries(
      Object.entries(data).filter(([, valor]) => valor !== null && valor !== ""),
    ),
  };
}

async function carregarImagemComoDataUrl(url) {
  if (!url) return null;

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return null;

    const blob = await resposta.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function obterFormatoImagem(dataUrl) {
  if (dataUrl?.startsWith("data:image/png")) return "PNG";
  if (dataUrl?.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

function formatarReais(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(dataIso) {
  return new Date(dataIso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function gerarReciboPDF(compra) {
  const empresa = await buscarEmpresa(compra);
  const logoDataUrl = await carregarImagemComoDataUrl(empresa.logo_url);
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const largura = doc.internal.pageSize.getWidth();

  // ---- LOGO ----
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, obterFormatoImagem(logoDataUrl), 10, 10, 40, 15);
  }

  // ---- Cabeçalho ----
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(empresa.nome, largura / 2 + 10, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Tel: ${empresa.telefone}`, largura / 2 + 10, 21, {
    align: "center",
  });
  doc.text(empresa.endereco, largura / 2 + 10, 25, { align: "center" });
  doc.text(empresa.bairro, largura / 2 + 10, 29, { align: "center" });
  doc.text(`CNPJ: ${empresa.cnpj}`, largura / 2 + 10, 33, { align: "center" });

  // Linha divisória
  doc.setDrawColor(180);
  doc.line(10, 38, largura - 10, 38);

  // ---- Dados do recibo ----
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `RECIBO Nº ${String(compra.numero_recibo).padStart(4, "0")}`,
    10,
    45,
  );

  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${formatarData(compra.data_hora)}`, largura - 10, 45, {
    align: "right",
  });

  if (compra.cliente_nome) {
    doc.text(`Cliente: ${compra.cliente_nome}`, 10, 51);
  }

  doc.text(
    `Pagamento: ${compra.forma_pagamento || "Dinheiro"}`,
    largura - 10,
    51,
    { align: "right" },
  );

  // ---- Tabela de itens ----
  const linhas = compra.itens_compra.map((item) => [
    item.material_nome,
    `${Number(item.peso_kg).toFixed(3)} kg`,
    formatarReais(item.preco_por_kg) + "/kg",
    formatarReais(item.valor_total),
  ]);

  autoTable(doc, {
    startY: 56,
    head: [["Material", "Peso", "Preço/kg", "Total"]],
    body: linhas,
    theme: "grid",
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 28, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = doc.lastAutoTable.finalY + 6;

  // ---- Total ----
  doc.setDrawColor(180);
  doc.line(10, finalY - 2, largura - 10, finalY - 2);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 10, finalY + 6);
  doc.text(formatarReais(compra.valor_total), largura - 10, finalY + 6, {
    align: "right",
  });

  // ---- Observações ----
  if (compra.observacoes) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Obs: ${compra.observacoes}`, 10, finalY + 14);
  }

  // ---- Rodapé ----
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("Obrigado pela preferência!", largura / 2, finalY + 22, {
    align: "center",
  });

  return doc;
}

export async function baixarPDF(compra) {
  const doc = await gerarReciboPDF(compra);
  doc.save(`recibo-${String(compra.numero_recibo).padStart(4, "0")}.pdf`);
}

export async function abrirPDFNovaAba(compra) {
  const aba = window.open("", "_blank");
  const doc = await gerarReciboPDF(compra);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  if (aba) {
    aba.location.href = url;
  } else {
    window.open(url, "_blank");
  }
}

export async function compartilharWhatsApp(compra) {
  const aba = window.open("", "_blank");
  const empresa = await buscarEmpresa(compra);
  const num = String(compra.numero_recibo).padStart(4, "0");
  const data = new Date(compra.data_hora).toLocaleDateString("pt-BR");

  const itens = compra.itens_compra
    .map(
      (i) =>
        `• ${i.material_nome}: ${Number(i.peso_kg).toFixed(3)}kg × R$${Number(i.preco_por_kg).toFixed(2)}/kg = R$${Number(i.valor_total).toFixed(2)}`,
    )
    .join("\n");

  const msg = encodeURIComponent(
    `*${empresa.nome}* — Recibo Nº ${num}\n` +
      `📅 Data: ${data}\n` +
      (compra.cliente_nome ? `👤 Cliente: ${compra.cliente_nome}\n` : "") +
      `\n*Materiais:*\n${itens}\n\n` +
      `*TOTAL: R$${Number(compra.valor_total).toFixed(2)}*\n\n` +
      `${empresa.telefone}`,
  );

  const url = `https://wa.me/?text=${msg}`;
  if (aba) {
    aba.location.href = url;
  } else {
    window.open(url, "_blank");
  }
}
