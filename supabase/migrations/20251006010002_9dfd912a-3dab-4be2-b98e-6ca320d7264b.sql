-- Desabilitar RLS na tabela gabinetes
ALTER TABLE gabinetes DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas
DROP POLICY IF EXISTS "Usuários podem criar seu primeiro gabinete" ON gabinetes;
DROP POLICY IF EXISTS "Usuários veem apenas seus gabinetes" ON gabinetes;
DROP POLICY IF EXISTS "Admins podem atualizar gabinete" ON gabinetes;