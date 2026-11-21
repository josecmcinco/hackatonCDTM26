import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppMode } from '../types';
import { api } from '../api';

interface AppContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  blindMode: boolean;
  setBlindMode: (enabled: boolean) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  isCommandOpen: boolean;
  setIsCommandOpen: (open: boolean) => void;
  copilotInitialPrompt?: string;
  openCopilotWithPrompt: (prompt: string) => void;
  approvedCount: number;
  incrementApprovedCount: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>('staffing');
  const [blindMode, setBlindModeState] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState<string | undefined>(undefined);
  const [approvedCount, setApprovedCount] = useState<number>(0);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
  };

  const setBlindMode = (enabled: boolean) => {
    setBlindModeState(enabled);
    api.logBlindModeChange(enabled);
  };

  const openCopilotWithPrompt = (prompt: string) => {
    setCopilotInitialPrompt(prompt);
    setIsCopilotOpen(true);
  };

  const incrementApprovedCount = () => {
    setApprovedCount((c) => c + 1);
  };

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        blindMode,
        setBlindMode,
        isCopilotOpen,
        setIsCopilotOpen,
        isCommandOpen,
        setIsCommandOpen,
        copilotInitialPrompt,
        openCopilotWithPrompt,
        approvedCount,
        incrementApprovedCount,
      }}
    >
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
