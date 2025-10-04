import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGabinete } from '@/contexts/GabineteContext';

type Permission = 
  | 'view_eleitores'
  | 'create_eleitores'
  | 'edit_eleitores'
  | 'delete_eleitores'
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
  | 'view_relatorios'
  | 'manage_users'
  | 'manage_settings';

export function usePermissions() {
  const { user } = useAuth();
  const { currentGabinete } = useGabinete();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user || !currentGabinete) {
        console.log('usePermissions: Sem user ou gabinete', { user: !!user, currentGabinete: !!currentGabinete });
        setPermissions([]);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Verificar se é owner ou admin
        const role = currentGabinete.role;
        console.log('usePermissions: Role do usuário:', role, 'User ID:', user.id, 'Gabinete ID:', currentGabinete.gabinete_id);
        
        if (role === 'owner' || role === 'admin') {
          // Owners e admins têm todas as permissões
          const allPermissions: Permission[] = [
            'view_eleitores',
            'create_eleitores',
            'edit_eleitores',
            'delete_eleitores',
            'view_demandas',
            'create_demandas',
            'edit_demandas',
            'delete_demandas',
            'view_agenda',
            'create_agenda',
            'edit_agenda',
            'delete_agenda',
            'view_roteiros',
            'create_roteiros',
            'edit_roteiros',
            'delete_roteiros',
            'view_relatorios',
            'manage_users',
            'manage_settings',
          ];
          console.log('usePermissions: Definindo todas as permissões para admin/owner');
          setPermissions(allPermissions);
          setIsAdmin(true);
        } else {
          // Buscar permissões específicas do assessor
          console.log('usePermissions: Buscando permissões para assessor');
          const { data: userGabineteData, error: ugError } = await supabase
            .from('user_gabinetes')
            .select('id')
            .eq('user_id', user.id)
            .eq('gabinete_id', currentGabinete.gabinete_id)
            .eq('ativo', true)
            .maybeSingle();

          console.log('usePermissions: userGabineteData:', userGabineteData, 'error:', ugError);

          if (userGabineteData) {
            const { data: permsData, error: permsError } = await supabase
              .from('user_permissions')
              .select('permission')
              .eq('user_gabinete_id', userGabineteData.id);

            console.log('usePermissions: Permissões do assessor:', permsData, 'error:', permsError);

            const loadedPermissions = (permsData || []).map(p => p.permission as Permission);
            console.log('usePermissions: Permissões carregadas:', loadedPermissions);
            setPermissions(loadedPermissions);
          } else {
            console.log('usePermissions: Nenhum user_gabinete encontrado para assessor');
            setPermissions([]);
          }
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        setPermissions([]);
        setIsAdmin(false);
      } finally {
        console.log('usePermissions: Finalizando, loading = false, total permissions:', permissions.length);
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, currentGabinete]);

  const hasPermission = (permission: Permission): boolean => {
    const result = permissions.includes(permission);
    console.log('hasPermission:', permission, '=', result, '| total permissions:', permissions.length, '| permissions:', permissions);
    return result;
  };

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(p => permissions.includes(p));
  };

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(p => permissions.includes(p));
  };

  return {
    permissions,
    loading,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
