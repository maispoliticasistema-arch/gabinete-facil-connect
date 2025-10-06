import { supabase } from "@/integrations/supabase/client";

type AuditAction = 
  | 'create'
  | 'update' 
  | 'delete'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'user_created'
  | 'user_disabled'
  | 'user_deleted'
  | 'export_report'
  | 'import_data';

type AuditEntity =
  | 'eleitor'
  | 'demanda'
  | 'agenda'
  | 'roteiro'
  | 'tag'
  | 'user'
  | 'gabinete'
  | 'permission'
  | 'relatorio';

interface LogAuditParams {
  gabineteId: string;
  action: AuditAction;
  entityType?: AuditEntity;
  entityId?: string;
  details?: Record<string, any>;
}

export async function logAudit({
  gabineteId,
  action,
  entityType,
  entityId,
  details
}: LogAuditParams) {
  try {
    const { error } = await supabase.rpc('log_audit_action', {
      _gabinete_id: gabineteId,
      _action: action as any,
      _entity_type: (entityType || null) as any,
      _entity_id: entityId || null,
      _details: details || null
    });

    if (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
  }
}
