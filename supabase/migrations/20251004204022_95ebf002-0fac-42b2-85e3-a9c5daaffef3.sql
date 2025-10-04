-- Criar enum para status de roteiro
CREATE TYPE roteiro_status AS ENUM ('planejado', 'em_andamento', 'concluido', 'cancelado');

-- Criar tabela de roteiros
CREATE TABLE public.roteiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL,
  nome TEXT NOT NULL,
  data DATE NOT NULL,
  hora_inicio TIME,
  responsavel_id UUID,
  objetivo TEXT,
  status roteiro_status NOT NULL DEFAULT 'planejado',
  distancia_total NUMERIC,
  tempo_estimado INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_por UUID
);

-- Criar tabela de pontos do roteiro
CREATE TABLE public.roteiro_pontos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roteiro_id UUID NOT NULL REFERENCES public.roteiros(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  eleitor_id UUID REFERENCES public.eleitores(id) ON DELETE SET NULL,
  demanda_id UUID REFERENCES public.demandas(id) ON DELETE SET NULL,
  endereco_manual TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  observacoes TEXT,
  visitado BOOLEAN DEFAULT false,
  visitado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_roteiros_gabinete ON public.roteiros(gabinete_id);
CREATE INDEX idx_roteiros_data ON public.roteiros(data);
CREATE INDEX idx_roteiros_status ON public.roteiros(status);
CREATE INDEX idx_roteiro_pontos_roteiro ON public.roteiro_pontos(roteiro_id);
CREATE INDEX idx_roteiro_pontos_ordem ON public.roteiro_pontos(roteiro_id, ordem);

-- Enable RLS
ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiro_pontos ENABLE ROW LEVEL SECURITY;

-- RLS Policies para roteiros
CREATE POLICY "Usuários podem ver roteiros dos seus gabinetes"
  ON public.roteiros FOR SELECT
  USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem criar roteiros nos seus gabinetes"
  ON public.roteiros FOR INSERT
  WITH CHECK (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem atualizar roteiros dos seus gabinetes"
  ON public.roteiros FOR UPDATE
  USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem deletar roteiros dos seus gabinetes"
  ON public.roteiros FOR DELETE
  USING (user_has_gabinete_access(gabinete_id));

-- RLS Policies para pontos do roteiro
CREATE POLICY "Usuários podem ver pontos dos roteiros dos seus gabinetes"
  ON public.roteiro_pontos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.roteiros
      WHERE roteiros.id = roteiro_pontos.roteiro_id
      AND user_has_gabinete_access(roteiros.gabinete_id)
    )
  );

CREATE POLICY "Usuários podem criar pontos nos roteiros dos seus gabinetes"
  ON public.roteiro_pontos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roteiros
      WHERE roteiros.id = roteiro_pontos.roteiro_id
      AND user_has_gabinete_access(roteiros.gabinete_id)
    )
  );

CREATE POLICY "Usuários podem atualizar pontos dos roteiros dos seus gabinetes"
  ON public.roteiro_pontos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.roteiros
      WHERE roteiros.id = roteiro_pontos.roteiro_id
      AND user_has_gabinete_access(roteiros.gabinete_id)
    )
  );

CREATE POLICY "Usuários podem deletar pontos dos roteiros dos seus gabinetes"
  ON public.roteiro_pontos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.roteiros
      WHERE roteiros.id = roteiro_pontos.roteiro_id
      AND user_has_gabinete_access(roteiros.gabinete_id)
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_roteiros_updated_at
  BEFORE UPDATE ON public.roteiros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();