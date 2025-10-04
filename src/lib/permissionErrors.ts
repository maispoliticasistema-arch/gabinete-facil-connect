/**
 * Verifica se um erro é relacionado a permissões (RLS)
 */
export function isPermissionError(error: any): boolean {
  if (!error) return false;
  
  // Códigos de erro conhecidos do Supabase para RLS
  const permissionCodes = ['PGRST301', '42501'];
  
  return (
    permissionCodes.includes(error.code) ||
    error.message?.toLowerCase().includes('row-level security') ||
    error.message?.toLowerCase().includes('permission') ||
    error.message?.toLowerCase().includes('policy')
  );
}

/**
 * Retorna mensagem de erro apropriada baseada na ação
 */
export function getPermissionErrorMessage(action: 'create' | 'edit' | 'delete' | 'view'): {
  title: string;
  description: string;
} {
  const actionMessages = {
    create: {
      title: 'Sem permissão',
      description: 'Você não tem permissão para criar este item.',
    },
    edit: {
      title: 'Sem permissão',
      description: 'Você não tem permissão para editar este item.',
    },
    delete: {
      title: 'Sem permissão',
      description: 'Você não tem permissão para excluir este item.',
    },
    view: {
      title: 'Sem permissão',
      description: 'Você não tem permissão para visualizar este item.',
    },
  };

  return actionMessages[action];
}
