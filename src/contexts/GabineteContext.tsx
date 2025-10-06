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

    console.log('🔍 GabineteContext: Dados retornados do banco:', {
      userId: user.id,
      gabinetes: data,
      error: error
    });

    if (error) {
      console.error('Erro ao buscar gabinetes:', error);
      setLoading(false);
      return;
    }

    const gabinetesList = data || [];
    console.log('🔍 GabineteContext: Lista de gabinetes processada:', gabinetesList.map(g => ({
      gabinete_id: g.gabinete_id,
      role: g.role,
      nome: g.gabinetes?.nome
    })));
    
    setGabinetes(gabinetesList);
    
    if (gabinetesList.length > 0) {
      setCurrentGabinete(prev => {
        const currentExists = prev && gabinetesList.some(g => g.gabinete_id === prev.gabinete_id);
        const newCurrent = currentExists ? prev : gabinetesList[0];
        
        console.log('🔍 GabineteContext: Gabinete atual selecionado:', {
          gabinete_id: newCurrent.gabinete_id,
          role: newCurrent.role,
          nome: newCurrent.gabinetes?.nome
        });
        
        return newCurrent;
      });
    } else {
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
