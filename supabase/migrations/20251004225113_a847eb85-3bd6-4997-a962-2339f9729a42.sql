-- Atualizar políticas de user_gabinetes para permitir que admins vejam todos os usuários do gabinete

-- Remover política antiga que só permite ver a própria relação
DROP POLICY IF EXISTS "Usuários podem ver suas próprias relações" ON public.user_gabinetes;

-- Nova política: usuários podem ver todos os membros dos gabinetes onde têm acesso
CREATE POLICY "Usuários podem ver membros dos seus gabinetes"
ON public.user_gabinetes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_gabinetes my_ug
    WHERE my_ug.user_id = auth.uid()
    AND my_ug.gabinete_id = user_gabinetes.gabinete_id
    AND my_ug.ativo = true
  )
);

-- Política para atualizar usuários (apenas admins e owners)
CREATE POLICY "Admins podem atualizar usuários do gabinete"
ON public.user_gabinetes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.user_gabinetes my_ug
    WHERE my_ug.user_id = auth.uid()
    AND my_ug.gabinete_id = user_gabinetes.gabinete_id
    AND my_ug.role IN ('owner', 'admin')
    AND my_ug.ativo = true
  )
);

-- Política para deletar usuários (apenas owners)
CREATE POLICY "Owners podem remover usuários do gabinete"
ON public.user_gabinetes
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.user_gabinetes my_ug
    WHERE my_ug.user_id = auth.uid()
    AND my_ug.gabinete_id = user_gabinetes.gabinete_id
    AND my_ug.role = 'owner'
    AND my_ug.ativo = true
  )
);