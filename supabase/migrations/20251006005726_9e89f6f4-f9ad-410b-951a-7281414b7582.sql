-- Reabilitar RLS na tabela gabinetes com políticas inteligentes
ALTER TABLE gabinetes ENABLE ROW LEVEL SECURITY;

-- Política de INSERT: Permitir criar gabinete se o usuário ainda não tem nenhum
-- OU se já tem vínculo (para casos de múltiplos gabinetes no futuro)
CREATE POLICY "Usuários podem criar seu primeiro gabinete"
ON gabinetes
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permitir se ainda não tem nenhum gabinete
  NOT EXISTS (
    SELECT 1 FROM user_gabinetes 
    WHERE user_id = auth.uid() 
    AND ativo = true
  )
);

-- Política de SELECT: Ver apenas gabinetes aos quais está vinculado
CREATE POLICY "Usuários veem apenas seus gabinetes"
ON gabinetes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_gabinetes
    WHERE user_gabinetes.user_id = auth.uid()
      AND user_gabinetes.gabinete_id = gabinetes.id
      AND user_gabinetes.ativo = true
  )
);

-- Política de UPDATE: Apenas owners e admins podem atualizar
CREATE POLICY "Admins podem atualizar gabinete"
ON gabinetes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_gabinetes
    WHERE user_gabinetes.user_id = auth.uid()
      AND user_gabinetes.gabinete_id = gabinetes.id
      AND user_gabinetes.role IN ('owner', 'admin')
      AND user_gabinetes.ativo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_gabinetes
    WHERE user_gabinetes.user_id = auth.uid()
      AND user_gabinetes.gabinete_id = gabinetes.id
      AND user_gabinetes.role IN ('owner', 'admin')
      AND user_gabinetes.ativo = true
  )
);

-- Política de DELETE: Apenas owners podem deletar (descomentado se necessário)
-- CREATE POLICY "Owners podem deletar gabinete"
-- ON gabinetes
-- FOR DELETE
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_gabinetes
--     WHERE user_gabinetes.user_id = auth.uid()
--       AND user_gabinetes.gabinete_id = gabinetes.id
--       AND user_gabinetes.role = 'owner'
--       AND user_gabinetes.ativo = true
--   )
-- );