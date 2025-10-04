-- Remover a política INSERT atual que pode estar causando conflito
DROP POLICY IF EXISTS "Usuários podem criar seus próprios gabinetes" ON public.gabinetes;

-- Criar nova política INSERT que permite inserção para usuários autenticados
CREATE POLICY "Usuários podem criar seus próprios gabinetes"
ON public.gabinetes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Garantir que o RLS está habilitado
ALTER TABLE public.gabinetes ENABLE ROW LEVEL SECURITY;

-- Verificar política de user_gabinetes também
DROP POLICY IF EXISTS "Usuários podem vincular-se aos gabinetes que criaram" ON public.user_gabinetes;

CREATE POLICY "Usuários podem vincular-se aos gabinetes que criaram"
ON public.user_gabinetes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());