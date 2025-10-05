-- Criar enum para roles do sistema (se não existir)
DO $$ BEGIN
  CREATE TYPE public.system_role AS ENUM ('superowner', 'support');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de roles do sistema (se não existir)
CREATE TABLE IF NOT EXISTS public.system_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role system_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.system_user_roles ENABLE ROW LEVEL SECURITY;

-- Dropar políticas antigas se existirem
DROP POLICY IF EXISTS "Superowners podem ver roles do sistema" ON public.system_user_roles;
DROP POLICY IF EXISTS "Superowners podem gerenciar roles" ON public.system_user_roles;

-- Dropar função antiga se existir (CASCADE para remover dependências)
DROP FUNCTION IF EXISTS public.has_system_role(uuid, system_role) CASCADE;

-- Função para verificar se usuário tem role de sistema
CREATE FUNCTION public.has_system_role(_user_id uuid, _role system_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.system_user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Política: apenas superowners podem ver roles
CREATE POLICY "Superowners podem ver roles do sistema"
ON public.system_user_roles
FOR SELECT
USING (has_system_role(auth.uid(), 'superowner'));

-- Política: apenas superowners podem gerenciar roles
CREATE POLICY "Superowners podem gerenciar roles"
ON public.system_user_roles
FOR ALL
USING (has_system_role(auth.uid(), 'superowner'))
WITH CHECK (has_system_role(auth.uid(), 'superowner'));