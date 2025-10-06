-- Remover todas as políticas RLS da tabela gabinetes
-- já que o RLS foi desabilitado
DROP POLICY IF EXISTS "gabinetes_insert_policy" ON gabinetes;
DROP POLICY IF EXISTS "gabinetes_select_policy" ON gabinetes;
DROP POLICY IF EXISTS "Admins podem atualizar gabinete" ON gabinetes;
DROP POLICY IF EXISTS "Usuários podem ver seus gabinetes" ON gabinetes;
DROP POLICY IF EXISTS "Qualquer um pode criar gabinetes" ON gabinetes;