import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Gabinete {
  id: string;
  nome: string;
  descricao: string | null;
  cidade: string | null;
  estado: string | null;
}

interface UserGabinete {
  gabinete_id: string;
  role: 'owner' | 'admin' | 'assessor';
  gabinetes: Gabinete;
}

interface GabineteContextType {
  gabinetes: UserGabinete[];
  currentGabinete: UserGabinete | null;
  setCurrentGabinete: (gabinete: UserGabinete) => void;
  loading: boolean;
  refetchGabinetes: () => Promise<void>;
}

const GabineteContext = createContext<GabineteContextType>({
  gabinetes: [],
  currentGabinete: null,
  setCurrentGabinete: () => {},
  loading: true,
  refetchGabinetes: async () => {},
});

export const useGabinete = () => useContext(GabineteContext);

export const GabineteProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [gabinetes, setGabinetes] = useState<UserGabinete[]>([]);
  const [currentGabinete, setCurrentGabinete] = useState<UserGabinete | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGabinetes = async () => {
    console.log('[GabineteContext] fetchGabinetes called, user:', user?.id);
    
    if (!user) {
      console.log('[GabineteContext] No user, clearing gabinetes');
      setGabinetes([]);
      setCurrentGabinete(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('[GabineteContext] Fetching gabinetes for user:', user.id);
    
    const { data, error } = await supabase
      .from('user_gabinetes')
      .select('gabinete_id, role, gabinetes(*)')
      .eq('user_id', user.id)
      .eq('ativo', true);

    if (error) {
      console.error('[GabineteContext] Erro ao buscar gabinetes:', error);
      setLoading(false);
      return;
    }

    const gabinetesList = data || [];
    console.log('[GabineteContext] Gabinetes loaded:', gabinetesList.length);
    setGabinetes(gabinetesList);
    
    // Always set first gabinete as current if we have gabinetes and no current selection
    if (gabinetesList.length > 0) {
      setCurrentGabinete(prev => {
        const currentExists = prev && gabinetesList.some(g => g.gabinete_id === prev.gabinete_id);
        const selected = currentExists ? prev : gabinetesList[0];
        console.log('[GabineteContext] Setting current gabinete:', selected.gabinete_id);
        return selected;
      });
    } else {
      console.log('[GabineteContext] No gabinetes found');
      setCurrentGabinete(null);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchGabinetes();
  }, [user]);

  return (
    <GabineteContext.Provider 
      value={{ 
        gabinetes, 
        currentGabinete, 
        setCurrentGabinete, 
        loading,
        refetchGabinetes: fetchGabinetes
      }}
    >
      {children}
    </GabineteContext.Provider>
  );
};
