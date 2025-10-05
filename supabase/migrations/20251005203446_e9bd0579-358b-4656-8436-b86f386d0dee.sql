-- Criar tipo enum para tipos de notificação
CREATE TYPE notification_type AS ENUM (
  'demanda_atribuida',
  'demanda_atualizada',
  'demanda_comentario',
  'demanda_concluida',
  'evento_proximo',
  'roteiro_atribuido'
);

-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias notificações"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sistema pode criar notificações"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_has_gabinete_access(gabinete_id));

-- Criar índices para performance
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_gabinete ON public.notifications(user_id, gabinete_id);

-- Função para criar notificação
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _gabinete_id UUID,
  _type notification_type,
  _title TEXT,
  _message TEXT,
  _entity_type TEXT DEFAULT NULL,
  _entity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    gabinete_id,
    type,
    title,
    message,
    entity_type,
    entity_id
  ) VALUES (
    _user_id,
    _gabinete_id,
    _type,
    _title,
    _message,
    _entity_type,
    _entity_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Permitir usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;