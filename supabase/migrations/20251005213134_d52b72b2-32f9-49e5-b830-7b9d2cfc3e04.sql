-- Criar tabela para armazenar configurações do portal de cada gabinete
CREATE TABLE public.portal_gabinete (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT,
  subtitulo TEXT,
  descricao TEXT,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#6366f1',
  cor_secundaria TEXT DEFAULT '#8b5cf6',
  layout_json JSONB DEFAULT '[]'::jsonb,
  publicado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gabinete_id)
);

-- Criar índices para otimizar consultas
CREATE INDEX idx_portal_gabinete_slug ON public.portal_gabinete(slug);
CREATE INDEX idx_portal_gabinete_gabinete_id ON public.portal_gabinete(gabinete_id);
CREATE INDEX idx_portal_gabinete_publicado ON public.portal_gabinete(publicado) WHERE publicado = true;

-- Habilitar RLS
ALTER TABLE public.portal_gabinete ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver portal do seu gabinete"
ON public.portal_gabinete
FOR SELECT
USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Admins podem criar portal do gabinete"
ON public.portal_gabinete
FOR INSERT
WITH CHECK (
  user_has_gabinete_access(gabinete_id) 
  AND user_is_gabinete_admin(gabinete_id)
);

CREATE POLICY "Admins podem atualizar portal do gabinete"
ON public.portal_gabinete
FOR UPDATE
USING (
  user_has_gabinete_access(gabinete_id) 
  AND user_is_gabinete_admin(gabinete_id)
);

CREATE POLICY "Portais públicos são visíveis para todos"
ON public.portal_gabinete
FOR SELECT
USING (publicado = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_portal_gabinete_updated_at
BEFORE UPDATE ON public.portal_gabinete
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar slug único baseado no nome do gabinete
CREATE OR REPLACE FUNCTION public.generate_portal_slug(gabinete_nome TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Remove acentos e caracteres especiais, converte para lowercase
  base_slug := lower(regexp_replace(
    unaccent(gabinete_nome),
    '[^a-z0-9]+', '-', 'g'
  ));
  
  -- Remove hífens do início e fim
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Verifica se já existe e adiciona número se necessário
  WHILE EXISTS (SELECT 1 FROM portal_gabinete WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;