import React from 'react';
import { GameState } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  finalPhrase: string | null;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState,
  score,
  finalPhrase,
  onStart,
  onRestart,
}) => {
  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute top-4 left-4 text-white font-mono text-xl drop-shadow-md">
        TIME SURVIVED: {score}s
        <div className="text-xs text-gray-300 mt-2">
          [WASD/ARROWS] Move | [SPACE] Crouch/Hide
        </div>
      </div>
    );
  }

  if (gameState === GameState.START) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10">
        <h1 className="text-4xl md:text-5xl text-center text-yellow-400 mb-8 animate-pulse font-bold tracking-tighter shadow-lg">
          CORPORATIVE<br />HIDE AND SEEK
        </h1>
        <div className="max-w-md text-center text-gray-300 mb-8 text-sm leading-6 font-mono">
          <p className="mb-4">Avoid the Boss. Don't do useless tasks.</p>
          <p className="mb-4">Hide in the Pantry or Restroom.<br/>Crouch behind desks to break line of sight.</p>
        </div>
        <button
          onClick={onStart}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-1 transition-all"
        >
          START SHIFT
        </button>
        <p className="mt-8 text-xs text-gray-500 animate-bounce">Press SPACE to Start</p>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 text-white z-10">
        <h2 className="text-6xl text-red-500 font-bold mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">CAUGHT!</h2>
        
        <div className="bg-white text-black p-6 rounded-lg max-w-lg relative mb-8 border-4 border-black">
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-gray-300 border-2 border-black rounded-full"></div>
          <p className="text-xl text-center font-bold">BOSS SAYS:</p>
          <p className="text-2xl text-center mt-2 text-red-600">"{finalPhrase}"</p>
        </div>

        <div className="text-2xl mb-8">
          Total Survival: <span className="text-yellow-400">{score} seconds</span>
        </div>

        <button
          onClick={onRestart}
          className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-[0_4px_0_rgb(20,83,45)] active:shadow-none active:translate-y-1 transition-all"
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  return null;
};

export default UIOverlay;