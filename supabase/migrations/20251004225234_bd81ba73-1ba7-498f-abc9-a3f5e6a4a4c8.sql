-- Remover políticas que causam recursão
DROP POLICY IF EXISTS "Usuários podem ver membros dos seus gabinetes" ON public.user_gabinetes;
DROP POLICY IF EXISTS "Admins podem atualizar usuários do gabinete" ON public.user_gabinetes;
DROP POLICY IF EXISTS "Owners podem remover usuários do gabinete" ON public.user_gabinetes;

-- Criar uma visão materializada ou usar uma abordagem diferente
-- A solução é permitir que usuários vejam todos os membros dos gabinetes onde estão ativos
-- mas sem causar recursão

-- Política simples: usuários podem ver relações do mesmo gabinete
-- Usamos a função user_has_gabinete_access que já existe e não causa recursão
CREATE POLICY "Usuários podem ver membros dos seus gabinetes"
ON public.user_gabinetes
FOR SELECT
USING (
  user_has_gabinete_access(gabinete_id)
);

-- Política para atualizar (apenas admins)
CREATE POLICY "Admins podem atualizar usuários do gabinete"
ON public.user_gabinetes
FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id)
  AND EXISTS (
    SELECT 1
    FROM public.user_gabinetes my_ug
    WHERE my_ug.user_id = auth.uid()
    AND my_ug.gabinete_id = user_gabinetes.gabinete_id
    AND my_ug.role IN ('owner', 'admin')
    AND my_ug.ativo = true
  )
);

-- Política para deletar (apenas owners)
CREATE POLICY "Owners podem remover usuários do gabinete"
ON public.user_gabinetes
FOR DELETE
USING (
  user_has_gabinete_access(gabinete_id)
  AND EXISTS (
    SELECT 1
    FROM public.user_gabinetes my_ug
    WHERE my_ug.user_id = auth.uid()
    AND my_ug.gabinete_id = user_gabinetes.gabinete_id
    AND my_ug.role = 'owner'
    AND my_ug.ativo = true
  )
);