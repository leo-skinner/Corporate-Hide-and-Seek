import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState<number>(0);
  const [gameOverPhrase, setGameOverPhrase] = useState<string | null>(null);

  const startGame = useCallback(() => {
    setGameState(GameState.PLAYING);
    setGameOverPhrase(null);
  }, []);

  const resetGame = useCallback(() => {
    setGameState(GameState.START);
    setScore(0);
    setGameOverPhrase(null);
  }, []);

  // Global Key Handler for Start Screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState === GameState.START) {
          startGame();
        } else if (gameState === GameState.GAME_OVER) {
          resetGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame, resetGame]);

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="relative rounded-xl overflow-hidden shadow-2xl">
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState} 
          setScore={setScore} 
          setGameOverPhrase={setGameOverPhrase}
        />
        <UIOverlay 
          gameState={gameState} 
          score={score} 
          finalPhrase={gameOverPhrase}
          onStart={startGame}
          onRestart={resetGame}
        />
      </div>
    </div>
  );
}

export default App;