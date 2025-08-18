/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ModalConfig {
  id: string;
  type: 'custom' | 'confirm' | 'form' | 'info';
  title: string;
  description?: string;
  content?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'default' | 'destructive';
}

interface ModalContextType {
  modals: ModalConfig[];
  openModal: (config: Omit<ModalConfig, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<ModalConfig>) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const openModal = (config: Omit<ModalConfig, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const modal: ModalConfig = { ...config, id };
    setModals(prev => [...prev, modal]);
    return id;
  };

  const closeModal = (id: string) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  };

  const closeAllModals = () => {
    setModals([]);
  };

  const updateModal = (id: string, updates: Partial<ModalConfig>) => {
    setModals(prev => prev.map(modal => 
      modal.id === id ? { ...modal, ...updates } : modal
    ));
  };

  return (
    <ModalContext.Provider value={{ 
      modals, 
      openModal, 
      closeModal, 
      closeAllModals, 
      updateModal 
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}