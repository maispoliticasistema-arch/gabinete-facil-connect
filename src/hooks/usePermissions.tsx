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
  | 'view_mapa'
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

      setLoading(true);
      console.log('usePermissions: Iniciando carregamento. Role:', currentGabinete.role, 'User ID:', user.id, 'Gabinete ID:', currentGabinete.gabinete_id);

      try {
        const role = currentGabinete.role;
        
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
            'view_mapa',
            'view_relatorios',
            'manage_users',
            'manage_settings',
          ];
          console.log('usePermissions: Definindo todas as permissões para admin/owner:', allPermissions.length, 'permissões');
          setPermissions(allPermissions);
          setIsAdmin(true);
          setLoading(false);
        } else if (role === 'assessor') {
          // Buscar permissões específicas do assessor
          console.log('usePermissions: Assessor detectado - Buscando permissões do banco...');
          
          const { data: userGabineteData, error: ugError } = await supabase
            .from('user_gabinetes')
            .select('id')
            .eq('user_id', user.id)
            .eq('gabinete_id', currentGabinete.gabinete_id)
            .eq('ativo', true)
            .maybeSingle();

          console.log('usePermissions: [1] user_gabinete query result:', { data: userGabineteData, error: ugError });

          if (ugError) {
            console.error('usePermissions: Erro ao buscar user_gabinete:', ugError);
            setPermissions([]);
            setIsAdmin(false);
            setLoading(false);
            return;
          }

          if (!userGabineteData) {
            console.warn('usePermissions: Nenhum user_gabinete encontrado para o assessor!');
            setPermissions([]);
            setIsAdmin(false);
            setLoading(false);
            return;
          }

          console.log('usePermissions: [2] Buscando permissões para user_gabinete_id:', userGabineteData.id);

          const { data: permsData, error: permsError } = await supabase
            .from('user_permissions')
            .select('permission')
            .eq('user_gabinete_id', userGabineteData.id);

          console.log('usePermissions: [3] Permissões retornadas do banco:', { 
            data: permsData, 
            error: permsError,
            dataType: typeof permsData,
            isArray: Array.isArray(permsData),
            dataContent: JSON.stringify(permsData)
          });

          if (permsError) {
            console.error('usePermissions: Erro ao buscar permissões:', permsError);
            setPermissions([]);
            setIsAdmin(false);
            setLoading(false);
            return;
          }

          if (!permsData || permsData.length === 0) {
            console.warn('usePermissions: [3.5] AVISO: permsData está vazio ou null!', permsData);
            setPermissions([]);
            setIsAdmin(false);
            setLoading(false);
            return;
          }

          const loadedPermissions = (permsData || []).map(p => {
            console.log('usePermissions: [4a] Processando permissão individual:', p, 'permission value:', p.permission);
            return p.permission as Permission;
          });
          console.log('usePermissions: [4b] Permissões processadas finais:', loadedPermissions, 'Total:', loadedPermissions.length);
          
          setPermissions(loadedPermissions);
          setIsAdmin(false);
          setLoading(false);
        } else {
          console.warn('usePermissions: Role desconhecido:', role);
          setPermissions([]);
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('usePermissions: Erro inesperado ao buscar permissões:', error);
        setPermissions([]);
        setIsAdmin(false);
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
