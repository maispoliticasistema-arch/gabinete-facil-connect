import { supabase } from "@/integrations/supabase/client";

type AuditAction = 
  | 'create'
  | 'update' 
  | 'delete'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'permission_change'
  | 'user_created'
  | 'user_disabled'
  | 'user_deleted'
  | 'user_invited'
  | 'user_approved'
  | 'user_rejected'
  | 'export_report'
  | 'import_data'
  | 'access_denied'
  | 'settings_changed';

type AuditEntity =
  | 'eleitor'
  | 'demanda'
  | 'agenda'
  | 'roteiro'
  | 'tag'
  | 'user'
  | 'gabinete'
  | 'permission'
  | 'relatorio'
  | 'nivel_envolvimento'
  | 'portal'
  | 'access_request';

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
