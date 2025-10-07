-- Remover constraint de formato de email da tabela eleitores
ALTER TABLE eleitores DROP CONSTRAINT IF EXISTS check_email_format;