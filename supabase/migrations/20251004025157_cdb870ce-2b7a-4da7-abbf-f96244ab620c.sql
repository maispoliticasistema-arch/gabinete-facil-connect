-- Criar enum para papéis de usuário
CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'assessor');

-- Criar enum para status de demanda
CREATE TYPE public.demanda_status AS ENUM ('aberta', 'em_andamento', 'concluida', 'cancelada');

-- Criar enum para prioridade de demanda
CREATE TYPE public.demanda_prioridade AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Tabela de gabinetes
CREATE TABLE public.gabinetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cidade TEXT,
  estado TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de relação usuário-gabinete com roles
CREATE TABLE public.user_gabinetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  gabinete_id UUID REFERENCES public.gabinetes(id) ON DELETE CASCADE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'assessor',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, gabinete_id)
);

-- Tabela de eleitores
CREATE TABLE public.eleitores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id UUID REFERENCES public.gabinetes(id) ON DELETE CASCADE NOT NULL,
  nome_completo TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  profissao TEXT,
  observacoes TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  cadastrado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de demandas
CREATE TABLE public.demandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id UUID REFERENCES public.gabinetes(id) ON DELETE CASCADE NOT NULL,
  eleitor_id UUID REFERENCES public.eleitores(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status public.demanda_status DEFAULT 'aberta',
  prioridade public.demanda_prioridade DEFAULT 'media',
  prazo DATE,
  responsavel_id UUID REFERENCES public.profiles(id),
  criado_por UUID REFERENCES public.profiles(id),
  concluida_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de agenda/eventos
CREATE TABLE public.agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id UUID REFERENCES public.gabinetes(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE,
  local TEXT,
  responsavel_id UUID REFERENCES public.profiles(id),
  criado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.gabinetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gabinetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eleitores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário pertence ao gabinete
CREATE OR REPLACE FUNCTION public.user_has_gabinete_access(gabinete_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_gabinetes
    WHERE user_id = auth.uid()
      AND gabinete_id = gabinete_uuid
      AND ativo = true
  )
$$;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas RLS para gabinetes
CREATE POLICY "Usuários podem ver gabinetes onde têm acesso"
  ON public.gabinetes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_gabinetes
      WHERE user_id = auth.uid()
        AND gabinete_id = id
        AND ativo = true
    )
  );

-- Políticas RLS para user_gabinetes
CREATE POLICY "Usuários podem ver suas próprias relações"
  ON public.user_gabinetes FOR SELECT
  USING (user_id = auth.uid());

-- Políticas RLS para eleitores
CREATE POLICY "Usuários podem ver eleitores dos seus gabinetes"
  ON public.eleitores FOR SELECT
  USING (public.user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem criar eleitores nos seus gabinetes"
  ON public.eleitores FOR INSERT
  WITH CHECK (public.user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem atualizar eleitores dos seus gabinetes"
  ON public.eleitores FOR UPDATE
  USING (public.user_has_gabinete_access(gabinete_id));

-- Políticas RLS para demandas
CREATE POLICY "Usuários podem ver demandas dos seus gabinetes"
  ON public.demandas FOR SELECT
  USING (public.user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem criar demandas nos seus gabinetes"
  ON public.demandas FOR INSERT
  WITH CHECK (public.user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem atualizar demandas dos seus gabinetes"
  ON public.demandas FOR UPDATE
  USING (public.user_has_gabinete_access(gabinete_id));

-- Políticas RLS para agenda
CREATE POLICY "Usuários podem ver agenda dos seus gabinetes"
  ON public.agenda FOR SELECT
  USING (public.user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem criar eventos nos seus gabinetes"
  ON public.agenda FOR INSERT
  WITH CHECK (public.user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem atualizar eventos dos seus gabinetes"
  ON public.agenda FOR UPDATE
  USING (public.user_has_gabinete_access(gabinete_id));

-- Trigger para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', new.email)
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_gabinetes_updated_at
  BEFORE UPDATE ON public.gabinetes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eleitores_updated_at
  BEFORE UPDATE ON public.eleitores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demandas_updated_at
  BEFORE UPDATE ON public.demandas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agenda_updated_at
  BEFORE UPDATE ON public.agenda
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();