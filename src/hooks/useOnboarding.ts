import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useOnboarding() {
  const { user, profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    if (user && profile) {
      // Verificar se o usuário já completou o onboarding
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_complete_${user.id}`);
      
      if (!hasCompletedOnboarding && profile.role === 'user') {
        // Mostrar onboarding apenas para usuários normais (não admin)
        setShowOnboarding(true);
      } else {
        setOnboardingComplete(true);
      }
    }
  }, [user, profile]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      setShowOnboarding(false);
      setOnboardingComplete(true);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const resetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`onboarding_complete_${user.id}`);
      setShowOnboarding(true);
      setOnboardingComplete(false);
    }
  };

  return {
    showOnboarding,
    onboardingComplete,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
}