import { useState, useEffect } from 'react';

interface UseCollapsibleSectionProps {
  storageKey: string;
  defaultOpen?: boolean;
}

export const useCollapsibleSection = ({ storageKey, defaultOpen = false }: UseCollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen;
    
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : defaultOpen;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isOpen));
  }, [isOpen, storageKey]);

  const toggle = () => setIsOpen(prev => !prev);

  return { isOpen, toggle };
};