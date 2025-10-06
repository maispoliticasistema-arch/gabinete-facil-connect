import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

type Permission = 
  | 'view_eleitores'
  | 'create_eleitores'
  | 'edit_eleitores'
  | 'delete_eleitores'
  | 'import_eleitores'
  | 'export_eleitores'
  | 'manage_tags'
  | 'view_demandas'
  | 'create_demandas'
  | 'edit_demandas'
  | 'delete_demandas'
  | 'view_agenda'
  | 'create_agenda'
  | 'edit_agenda'
  | 'delete_agenda'
  | 'view_roteiros'
  | 'create_roteiros'
  | 'edit_roteiros'
  | 'delete_roteiros'
  | 'view_mapa'
  | 'view_relatorios'
  | 'manage_users'
  | 'manage_settings';

interface PermissionGuardProps {
  permission: Permission | Permission[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function PermissionGuard({ 
  permission, 
  children, 
  fallback,
  requireAll = false 
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return null;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return fallback || null;
  }

  return <>{children}</>;
}

export function NoPermissionMessage() {
  return (
    <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
      <ShieldAlert className="h-4 w-4" />
      <AlertDescription>
        Você não tem permissão para acessar esta funcionalidade. Entre em contato com o administrador do gabinete.
      </AlertDescription>
    </Alert>
  );
}
