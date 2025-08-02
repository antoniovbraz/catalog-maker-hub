import { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <LayoutContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}