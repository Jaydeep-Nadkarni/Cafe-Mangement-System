import { createContext, useState } from 'react';

export const GameContext = createContext();

export function GameProvider({ children }) {
  const [isWordleOpen, setIsWordleOpen] = useState(false);

  return (
    <GameContext.Provider value={{ isWordleOpen, setIsWordleOpen }}>
      {children}
    </GameContext.Provider>
  );
}
