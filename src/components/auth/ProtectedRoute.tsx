import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useLogger } from '@/utils/logger';
import { Heading, Text } from '@/components/ui/typography';

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
  const logger = useLogger('ProtectedRoute');

  useEffect(() => {
    // Only set redirect state once when loading is complete and we have the final auth state
    if (!loading) {
      const needsRedirect = !user || !profile;
      logger.debug('Auth check', { user: !!user, profile: !!profile, needsRedirect, pathname: location.pathname });
      setShouldRedirect(needsRedirect);
    }
  }, [loading, user, profile, location.pathname, logger]);

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
            <Heading variant="h3" className="text-destructive mb-2">
              Acesso Negado
            </Heading>
            <Text className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </Text>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}