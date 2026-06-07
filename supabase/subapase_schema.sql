-- ============================================================
-- SCHEMA COMPLETO - SUCATA CURIÓ
-- Cole este SQL no Supabase > SQL Editor > New Query > Run
-- ============================================================

-- Tabela de materiais
CREATE TABLE materiais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco_padrao_kg DECIMAL(10,2),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clientes (opcional por compra)
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT,
  telefone TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Sequência para número de recibo
CREATE SEQUENCE numero_recibo_seq START 1;

-- Tabela de compras (cabeçalho)
CREATE TABLE compras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_recibo INTEGER DEFAULT nextval('numero_recibo_seq'),
  cliente_nome TEXT,
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'Dinheiro',
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens de cada compra
CREATE TABLE itens_compra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materiais(id),
  material_nome TEXT NOT NULL,
  peso_kg DECIMAL(10,3) NOT NULL,
  preco_por_kg DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela financeira (entradas e saídas)
CREATE TABLE financeiro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  compra_id UUID REFERENCES compras(id) ON DELETE SET NULL,
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de vendas (quando a sucataria vende para recicladora)
CREATE TABLE vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_nome TEXT NOT NULL,
  peso_kg DECIMAL(10,3) NOT NULL,
  preco_por_kg DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  comprador TEXT,
  observacoes TEXT,
  data_hora TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DADOS INICIAIS - Materiais padrão
-- ============================================================
INSERT INTO materiais (nome) VALUES
  ('Latinha'),
  ('Panela'),
  ('Perfil'),
  ('Offset'),
  ('Cabo Al'),
  ('Chaparia'),
  ('Bloco'),
  ('Pistão'),
  ('Roda'),
  ('Cobre Limpo'),
  ('Cobre Misto'),
  ('Cobre com Casca'),
  ('Cavaco Alumínio'),
  ('Cavaco Metal'),
  ('Metal'),
  ('Radiador Alumínio'),
  ('Condensador'),
  ('Bateria'),
  ('Chumbo'),
  ('Inox'),
  ('Zamac'),
  ('Motor Gel'),
  ('Ferro');

-- ============================================================
-- TRIGGER: ao salvar compra, registra saída no financeiro
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_saida_financeiro()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO financeiro (tipo, categoria, valor, descricao, compra_id, data_hora)
  VALUES (
    'saida',
    'Compra de sucata',
    NEW.valor_total,
    'Recibo #' || NEW.numero_recibo || COALESCE(' - ' || NEW.cliente_nome, ''),
    NEW.id,
    NEW.data_hora
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_saida_compra
AFTER INSERT ON compras
FOR EACH ROW EXECUTE FUNCTION registrar_saida_financeiro();

-- ============================================================
-- SEGURANÇA: Habilitar RLS e permitir acesso autenticado
-- (descomente se quiser login obrigatório)
-- ============================================================
-- ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE itens_compra ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Por enquanto, liberar acesso público (ajuste depois se precisar)
GRANT ALL ON materiais TO anon, authenticated;
GRANT ALL ON clientes TO anon, authenticated;
GRANT ALL ON compras TO anon, authenticated;
GRANT ALL ON itens_compra TO anon, authenticated;
GRANT ALL ON financeiro TO anon, authenticated;
GRANT ALL ON vendas TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE numero_recibo_seq TO anon, authenticated;