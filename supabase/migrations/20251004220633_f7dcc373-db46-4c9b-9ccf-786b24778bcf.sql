-- Adicionar novos campos à tabela agenda
ALTER TABLE public.agenda
ADD COLUMN IF NOT EXISTS tipo text CHECK (tipo IN ('reuniao', 'visita', 'evento_publico', 'viagem', 'interno', 'outros')) DEFAULT 'reuniao',
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('confirmado', 'pendente', 'concluido', 'cancelado')) DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS cor text DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS link_online text;

-- Criar tabela de participantes dos eventos
CREATE TABLE IF NOT EXISTS public.agenda_participantes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id uuid NOT NULL REFERENCES public.agenda(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  presente boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_agenda_participantes_evento_id ON public.agenda_participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_agenda_participantes_user_id ON public.agenda_participantes(user_id);
CREATE INDEX IF NOT EXISTS idx_agenda_data_inicio ON public.agenda(data_inicio);
CREATE INDEX IF NOT EXISTS idx_agenda_gabinete_id ON public.agenda(gabinete_id);

-- Habilitar RLS na tabela de participantes
ALTER TABLE public.agenda_participantes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para agenda_participantes
CREATE POLICY "Usuários podem ver participantes dos eventos dos seus gabinetes"
ON public.agenda_participantes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agenda
    WHERE agenda.id = agenda_participantes.evento_id
    AND user_has_gabinete_access(agenda.gabinete_id)
  )
);

CREATE POLICY "Usuários podem adicionar participantes aos eventos dos seus gabinetes"
ON public.agenda_participantes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agenda
    WHERE agenda.id = agenda_participantes.evento_id
    AND user_has_gabinete_access(agenda.gabinete_id)
  )
);

CREATE POLICY "Usuários podem atualizar participantes dos eventos dos seus gabinetes"
ON public.agenda_participantes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.agenda
    WHERE agenda.id = agenda_participantes.evento_id
    AND user_has_gabinete_access(agenda.gabinete_id)
  )
);

CREATE POLICY "Usuários podem deletar participantes dos eventos dos seus gabinetes"
ON public.agenda_participantes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.agenda
    WHERE agenda.id = agenda_participantes.evento_id
    AND user_has_gabinete_access(agenda.gabinete_id)
  )
);