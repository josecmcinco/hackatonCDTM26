import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  blindMode: boolean;
  setBlindMode: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [blindMode, setBlindMode] = useState<boolean>(false);

  return (
    <AppContext.Provider value={{ blindMode, setBlindMode }}>
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
