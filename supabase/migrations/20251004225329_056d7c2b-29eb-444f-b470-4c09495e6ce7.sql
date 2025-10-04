-- Criar função security definer para verificar role do usuário em um gabinete
-- Esta função bypassa RLS e evita recursão
CREATE OR REPLACE FUNCTION public.user_gabinete_role(
  _user_id uuid,
  _gabinete_id uuid
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_gabinetes
  WHERE user_id = _user_id
    AND gabinete_id = _gabinete_id
    AND ativo = true
  LIMIT 1
$$;

-- Recriar as políticas usando a função security definer
DROP POLICY IF EXISTS "Admins podem atualizar usuários do gabinete" ON public.user_gabinetes;
DROP POLICY IF EXISTS "Owners podem remover usuários do gabinete" ON public.user_gabinetes;

-- Política para atualizar (apenas admins e owners)
CREATE POLICY "Admins podem atualizar usuários do gabinete"
ON public.user_gabinetes
FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id)
  AND user_gabinete_role(auth.uid(), gabinete_id) IN ('owner', 'admin')
);

-- Política para deletar (apenas owners)
CREATE POLICY "Owners podem remover usuários do gabinete"
ON public.user_gabinetes
FOR DELETE
USING (
  user_has_gabinete_access(gabinete_id)
  AND user_gabinete_role(auth.uid(), gabinete_id) = 'owner'
);