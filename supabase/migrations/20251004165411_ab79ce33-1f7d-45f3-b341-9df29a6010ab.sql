-- Criar tabela de tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gabinete_id, nome)
);

-- Criar tabela de relação entre eleitores e tags
CREATE TABLE public.eleitor_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  eleitor_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(eleitor_id, tag_id)
);

-- Habilitar RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eleitor_tags ENABLE ROW LEVEL SECURITY;

-- Políticas para tags
CREATE POLICY "Usuários podem ver tags dos seus gabinetes" 
ON public.tags 
FOR SELECT 
USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem criar tags nos seus gabinetes" 
ON public.tags 
FOR INSERT 
WITH CHECK (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem atualizar tags dos seus gabinetes" 
ON public.tags 
FOR UPDATE 
USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem deletar tags dos seus gabinetes" 
ON public.tags 
FOR DELETE 
USING (user_has_gabinete_access(gabinete_id));

-- Políticas para eleitor_tags
CREATE POLICY "Usuários podem ver tags dos eleitores dos seus gabinetes" 
ON public.eleitor_tags 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.eleitores 
    WHERE eleitores.id = eleitor_tags.eleitor_id 
    AND user_has_gabinete_access(eleitores.gabinete_id)
  )
);

CREATE POLICY "Usuários podem adicionar tags aos eleitores dos seus gabinetes" 
ON public.eleitor_tags 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.eleitores 
    WHERE eleitores.id = eleitor_tags.eleitor_id 
    AND user_has_gabinete_access(eleitores.gabinete_id)
  )
);

CREATE POLICY "Usuários podem deletar tags dos eleitores dos seus gabinetes" 
ON public.eleitor_tags 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.eleitores 
    WHERE eleitores.id = eleitor_tags.eleitor_id 
    AND user_has_gabinete_access(eleitores.gabinete_id)
  )
);

-- Trigger para atualizar updated_at em tags
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();