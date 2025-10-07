-- Remover todas as políticas existentes de gabinetes
DROP POLICY IF EXISTS "Qualquer pessoa pode criar gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Usuários autenticados podem criar gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Owners podem atualizar seus gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Usuários podem ver seus gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Superowners podem ver todos os gabinetes" ON public.gabinetes;

-- Criar política permissiva para INSERT (qualquer pessoa pode criar)
CREATE POLICY "Permitir criação de gabinetes"
ON public.gabinetes
FOR INSERT
TO public
WITH CHECK (true);

-- Criar política para SELECT (usuários podem ver seus gabinetes)
CREATE POLICY "Permitir visualização de gabinetes"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_gabinetes
    WHERE user_id = auth.uid()
      AND gabinete_id = gabinetes.id
      AND ativo = true
  )
);

-- Criar política para UPDATE (owners podem atualizar)
CREATE POLICY "Permitir atualização de gabinetes"
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

-- Política para superowners verem tudo
CREATE POLICY "Superowners visualizam tudo"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'superowner'::system_role));