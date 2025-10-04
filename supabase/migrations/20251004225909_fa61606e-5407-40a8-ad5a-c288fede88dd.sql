-- Remover política problemática
DROP POLICY IF EXISTS "Usuários podem ver membros dos seus gabinetes" ON public.user_gabinetes;

-- Criar função SECURITY DEFINER para obter gabinetes do usuário sem RLS
CREATE OR REPLACE FUNCTION public.get_user_gabinetes_ids(_user_id uuid)
RETURNS TABLE(gabinete_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gabinete_id
  FROM public.user_gabinetes
  WHERE user_id = _user_id
    AND ativo = true
$$;

-- Nova política usando a função security definer
CREATE POLICY "Usuários podem ver membros dos seus gabinetes"
ON public.user_gabinetes
FOR SELECT
USING (
  gabinete_id IN (
    SELECT gabinete_id 
    FROM public.get_user_gabinetes_ids(auth.uid())
  )
);