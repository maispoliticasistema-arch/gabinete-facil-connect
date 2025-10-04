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
    if (!user) {
      setGabinetes([]);
      setCurrentGabinete(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('user_gabinetes')
      .select('gabinete_id, role, gabinetes(*)')
      .eq('user_id', user.id)
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao buscar gabinetes:', error);
      setLoading(false);
      return;
    }

    setGabinetes(data || []);
    
    // Set first gabinete as current if none selected
    if (data && data.length > 0 && !currentGabinete) {
      setCurrentGabinete(data[0]);
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
