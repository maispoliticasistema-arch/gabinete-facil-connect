import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGabinete } from '@/contexts/GabineteContext';

export const RequiresGabinete = ({ children }: { children: React.ReactNode }) => {
  const { gabinetes, loading } = useGabinete();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && gabinetes.length === 0) {
      navigate('/setup-gabinete');
    }
  }, [loading, gabinetes, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (gabinetes.length === 0) {
    return null;
  }

  return <>{children}</>;
};
