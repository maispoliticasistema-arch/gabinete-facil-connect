-- Adicionar campos de endereço ao gabinete para etiquetas de remetente
ALTER TABLE gabinetes
ADD COLUMN IF NOT EXISTS endereco_completo TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT;

COMMENT ON COLUMN gabinetes.endereco_completo IS 'Endereço completo do gabinete para usar como remetente em etiquetas';
COMMENT ON COLUMN gabinetes.numero IS 'Número do endereço do gabinete';
COMMENT ON COLUMN gabinetes.bairro IS 'Bairro do gabinete';
COMMENT ON COLUMN gabinetes.cidade IS 'Cidade do gabinete';
COMMENT ON COLUMN gabinetes.estado IS 'Estado do gabinete (UF)';
COMMENT ON COLUMN gabinetes.cep IS 'CEP do gabinete';