-- Remover política SELECT incorreta da tabela gabinetes
DROP POLICY IF EXISTS "Usuários podem ver gabinetes onde têm acesso" ON public.gabinetes;

-- Criar política SELECT correta
CREATE POLICY "Usuários podem ver gabinetes onde têm acesso"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_gabinetes
    WHERE user_gabinetes.user_id = auth.uid()
      AND user_gabinetes.gabinete_id = gabinetes.id
      AND user_gabinetes.ativo = true
  )
);

-- Garantir que a política INSERT existe
DROP POLICY IF EXISTS "Usuários podem criar seus próprios gabinetes" ON public.gabinetes;

CREATE POLICY "Usuários podem criar seus próprios gabinetes"
ON public.gabinetes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Garantir que a política INSERT existe para user_gabinetes
DROP POLICY IF EXISTS "Usuários podem vincular-se aos gabinetes que criaram" ON public.user_gabinetes;

CREATE POLICY "Usuários podem vincular-se aos gabinetes que criaram"
ON public.user_gabinetes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());