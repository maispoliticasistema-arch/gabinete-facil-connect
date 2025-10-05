-- Criar política para permitir cadastros públicos via link de indicação
CREATE POLICY "Cadastros públicos via link de indicação"
ON public.eleitores
FOR INSERT
WITH CHECK (
  -- Verifica se o cadastrado_por é um usuário válido do gabinete
  EXISTS (
    SELECT 1 
    FROM user_gabinetes ug
    WHERE ug.user_id = eleitores.cadastrado_por
    AND ug.gabinete_id = eleitores.gabinete_id
    AND ug.ativo = true
  )
);