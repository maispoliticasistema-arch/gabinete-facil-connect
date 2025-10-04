-- Criar tabela para comentários e atualizações de demandas
CREATE TABLE public.demanda_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demanda_id UUID NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comentario TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'comentario', -- comentario, status_change, prioridade_change, etc
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demanda_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para comentários
CREATE POLICY "Usuários podem ver comentários das demandas dos seus gabinetes"
ON public.demanda_comentarios
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.demandas
    WHERE demandas.id = demanda_comentarios.demanda_id
    AND user_has_gabinete_access(demandas.gabinete_id)
  )
);

CREATE POLICY "Usuários podem criar comentários nas demandas dos seus gabinetes"
ON public.demanda_comentarios
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.demandas
    WHERE demandas.id = demanda_comentarios.demanda_id
    AND user_has_gabinete_access(demandas.gabinete_id)
  )
);

-- Criar índices para performance
CREATE INDEX idx_demanda_comentarios_demanda_id ON public.demanda_comentarios(demanda_id);
CREATE INDEX idx_demanda_comentarios_created_at ON public.demanda_comentarios(created_at DESC);

-- Criar storage bucket para anexos de demandas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('demanda-anexos', 'demanda-anexos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para anexos
CREATE POLICY "Usuários podem fazer upload de anexos nas demandas dos seus gabinetes"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'demanda-anexos' AND
  EXISTS (
    SELECT 1
    FROM public.demandas
    WHERE demandas.id::text = (storage.foldername(name))[1]
    AND user_has_gabinete_access(demandas.gabinete_id)
  )
);

CREATE POLICY "Usuários podem ver anexos das demandas dos seus gabinetes"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'demanda-anexos' AND
  EXISTS (
    SELECT 1
    FROM public.demandas
    WHERE demandas.id::text = (storage.foldername(name))[1]
    AND user_has_gabinete_access(demandas.gabinete_id)
  )
);

CREATE POLICY "Usuários podem deletar anexos das demandas dos seus gabinetes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'demanda-anexos' AND
  EXISTS (
    SELECT 1
    FROM public.demandas
    WHERE demandas.id::text = (storage.foldername(name))[1]
    AND user_has_gabinete_access(demandas.gabinete_id)
  )
);