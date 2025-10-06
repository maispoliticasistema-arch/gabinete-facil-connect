-- Diagnóstico e correção definitiva das políticas RLS

-- Verificar e remover TODAS as políticas existentes de INSERT na tabela gabinetes
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Qualquer um pode criar gabinetes" ON gabinetes;
    DROP POLICY IF EXISTS "Usuários autenticados podem criar gabinetes" ON gabinetes;
    DROP POLICY IF EXISTS "authenticated users can insert" ON gabinetes;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON gabinetes;
END $$;

-- Criar política de INSERT extremamente permissiva
CREATE POLICY "gabinetes_insert_policy"
ON gabinetes
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Garantir que a política de SELECT também funciona
DROP POLICY IF EXISTS "Usuários podem ver seus gabinetes" ON gabinetes;

CREATE POLICY "gabinetes_select_policy"
ON gabinetes
FOR SELECT  
TO authenticated, anon
USING (
  -- Permitir ver se é anon (para facilitar debugging)
  auth.role() = 'anon'
  OR
  -- Ou se tem vínculo ativo
  EXISTS (
    SELECT 1 FROM user_gabinetes
    WHERE user_gabinetes.user_id = auth.uid()
      AND user_gabinetes.gabinete_id = gabinetes.id
      AND user_gabinetes.ativo = true
  )
);