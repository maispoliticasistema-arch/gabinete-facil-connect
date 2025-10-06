-- Permitir que usuários autenticados criem gabinetes
CREATE POLICY "Usuários autenticados podem criar gabinetes"
ON public.gabinetes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que owners atualizem seus gabinetes
CREATE POLICY "Owners podem atualizar seus gabinetes"
ON public.gabinetes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_gabinetes
    WHERE user_id = auth.uid()
      AND gabinete_id = gabinetes.id
      AND role = 'owner'
      AND ativo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_gabinetes
    WHERE user_id = auth.uid()
      AND gabinete_id = gabinetes.id
      AND role = 'owner'
      AND ativo = true
  )
);

-- Permitir que usuários vejam gabinetes aos quais têm acesso
CREATE POLICY "Usuários podem ver seus gabinetes"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (user_has_gabinete_access(id));