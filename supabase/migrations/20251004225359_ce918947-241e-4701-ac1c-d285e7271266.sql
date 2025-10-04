-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins podem atualizar usuários do gabinete" ON public.user_gabinetes;
DROP POLICY IF EXISTS "Owners podem remover usuários do gabinete" ON public.user_gabinetes;

-- Criar função para verificar se usuário é admin/owner de um gabinete (sem recursão)
CREATE OR REPLACE FUNCTION public.user_is_gabinete_admin(
  _gabinete_id uuid,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_gabinetes
    WHERE user_id = _user_id
      AND gabinete_id = _gabinete_id
      AND role IN ('owner', 'admin')
      AND ativo = true
  )
$$;

-- Criar função para verificar se usuário é owner de um gabinete (sem recursão)
CREATE OR REPLACE FUNCTION public.user_is_gabinete_owner(
  _gabinete_id uuid,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_gabinetes
    WHERE user_id = _user_id
      AND gabinete_id = _gabinete_id
      AND role = 'owner'
      AND ativo = true
  )
$$;

-- Política para atualizar (apenas admins) - usando função security definer
CREATE POLICY "Admins podem atualizar usuários do gabinete"
ON public.user_gabinetes
FOR UPDATE
USING (
  user_is_gabinete_admin(gabinete_id)
);

-- Política para deletar (apenas owners) - usando função security definer
CREATE POLICY "Owners podem remover usuários do gabinete"
ON public.user_gabinetes
FOR DELETE
USING (
  user_is_gabinete_owner(gabinete_id)
);