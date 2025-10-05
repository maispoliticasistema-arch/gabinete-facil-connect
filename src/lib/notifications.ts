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
  entityId,
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabase.rpc('create_notification', {
      _user_id: userId,
      _gabinete_id: gabineteId,
      _type: type,
      _title: title,
      _message: message,
      _entity_type: entityType || null,
      _entity_id: entityId || null,
    });

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

// Função auxiliar para notificar atribuição de demanda
export async function notifyDemandaAtribuida({
  responsavelId,
  demandaTitulo,
  demandaId,
  gabineteId,
  atribuidoPor,
}: {
  responsavelId: string;
  demandaTitulo: string;
  demandaId: string;
  gabineteId: string;
  atribuidoPor: string;
}) {
  return createNotification({
    userId: responsavelId,
    gabineteId,
    type: 'demanda_atribuida',
    title: 'Nova demanda atribuída',
    message: `Você foi designado(a) como responsável pela demanda "${demandaTitulo}"`,
    entityType: 'demanda',
    entityId: demandaId,
  });
}

// Função auxiliar para notificar atualização de demanda
export async function notifyDemandaAtualizada({
  responsavelId,
  demandaTitulo,
  demandaId,
  gabineteId,
  campo,
}: {
  responsavelId: string;
  demandaTitulo: string;
  demandaId: string;
  gabineteId: string;
  campo: string;
}) {
  return createNotification({
    userId: responsavelId,
    gabineteId,
    type: 'demanda_atualizada',
    title: 'Demanda atualizada',
    message: `A demanda "${demandaTitulo}" foi atualizada: ${campo}`,
    entityType: 'demanda',
    entityId: demandaId,
  });
}

// Função auxiliar para notificar conclusão de demanda
export async function notifyDemandaConcluida({
  responsavelId,
  demandaTitulo,
  demandaId,
  gabineteId,
}: {
  responsavelId: string;
  demandaTitulo: string;
  demandaId: string;
  gabineteId: string;
}) {
  return createNotification({
    userId: responsavelId,
    gabineteId,
    type: 'demanda_concluida',
    title: 'Demanda concluída',
    message: `A demanda "${demandaTitulo}" foi marcada como concluída`,
    entityType: 'demanda',
    entityId: demandaId,
  });
}
