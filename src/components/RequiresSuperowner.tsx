import { Navigate } from 'react-router-dom';
import { useSuperowner } from '@/hooks/useSuperowner';

export const RequiresSuperowner = ({ children }: { children: React.ReactNode }) => {
  const { isSuperowner, loading } = useSuperowner();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperowner) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};
