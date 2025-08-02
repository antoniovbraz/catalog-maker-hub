import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'admin' | 'user';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Only check for redirect after loading is complete
    if (!loading) {
      if (!user || !profile) {
        setShouldRedirect(true);
      } else if (requiredRole) {
        const roleHierarchy = {
          'user': 1,
          'admin': 2,
          'super_admin': 3
        };

        const userLevel = roleHierarchy[profile.role];
        const requiredLevel = roleHierarchy[requiredRole];

        if (userLevel < requiredLevel) {
          setShouldRedirect(false); // Don't redirect, show access denied
        } else {
          setShouldRedirect(false);
        }
      } else {
        setShouldRedirect(false);
      }
    }
  }, [loading, user, profile, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  // If we should redirect and we're not already on the redirect page
  if (shouldRedirect && location.pathname !== redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // If not authenticated, don't render anything (will redirect)
  if (!user || !profile) {
    return null;
  }

  // Check role permissions
  if (requiredRole) {
    const roleHierarchy = {
      'user': 1,
      'admin': 2,
      'super_admin': 3
    };

    const userLevel = roleHierarchy[profile.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              Acesso Negado
            </h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}