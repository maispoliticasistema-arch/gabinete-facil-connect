import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const RequiresSuperowner = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperowner = async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_system_role', {
          _user_id: user.id,
          _role: 'superowner'
        });

        if (error) {
          console.error('Erro ao verificar role:', error);
          setHasAccess(false);
        } else {
          setHasAccess(data || false);
        }
      } catch (error) {
        console.error('Erro ao verificar superowner:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkSuperowner();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || hasAccess === false) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};
