import { supabase } from "@/integrations/supabase/client";

type NotificationType =
  | 'demanda_atribuida'
  | 'demanda_atualizada'
  | 'demanda_comentario'
  | 'demanda_concluida'
  | 'evento_proximo'
  | 'roteiro_atribuido';

interface CreateNotificationParams {
  userId: string;
  gabineteId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export async function createNotification({
  userId,
  gabineteId,
  type,
  title,
  message,
  entityType,
  entityId
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabase.rpc('create_notification', {
      _user_id: userId,
      _gabinete_id: gabineteId,
      _type: type,
      _title: title,
      _message: message,
      _entity_type: entityType || null,
      _entity_id: entityId || null
    });

    if (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}
