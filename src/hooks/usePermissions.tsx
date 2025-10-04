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
        setPermissions([]);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Verificar se é owner ou admin
        const role = currentGabinete.role;
        
        if (role === 'owner' || role === 'admin') {
          // Owners e admins têm todas as permissões
          setPermissions([
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
          ]);
          setIsAdmin(true);
        } else {
          // Buscar permissões específicas do assessor
          const { data: userGabineteData } = await supabase
            .from('user_gabinetes')
            .select('id')
            .eq('user_id', user.id)
            .eq('gabinete_id', currentGabinete.gabinete_id)
            .eq('ativo', true)
            .maybeSingle();

          if (userGabineteData) {
            const { data: permsData } = await supabase
              .from('user_permissions')
              .select('permission')
              .eq('user_gabinete_id', userGabineteData.id);

            setPermissions((permsData || []).map(p => p.permission as Permission));
          }
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        setPermissions([]);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, currentGabinete]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
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
