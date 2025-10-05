import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useSuperowner() {
  const { user } = useAuth();
  const [isSuperowner, setIsSuperowner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSuperowner() {
      if (!user) {
        setIsSuperowner(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_system_role', {
          _user_id: user.id,
          _role: 'superowner'
        });

        if (error) {
          console.error('Erro ao verificar role de superowner:', error);
          setIsSuperowner(false);
        } else {
          setIsSuperowner(data || false);
        }
      } catch (error) {
        console.error('Erro ao verificar role de superowner:', error);
        setIsSuperowner(false);
      } finally {
        setLoading(false);
      }
    }

    checkSuperowner();
  }, [user]);

  return { isSuperowner, loading };
}
