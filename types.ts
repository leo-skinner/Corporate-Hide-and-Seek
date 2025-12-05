export enum GameState {
  START,
  PLAYING,
  GAME_OVER,
}

export enum EntityType {
  PLAYER,
  BOSS,
  COFFEE_LADY,
  OBSTACLE,
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Position;
  size: Size;
  velocity: Position;
  speed: number;
  color: string;
  angle: number; // For facing direction
}

export interface Player extends Entity {
  isCrouching: boolean;
}

export enum BossState {
  IDLE,      // Inside office
  SEARCHING, // Wandering room
  CHASING,   // Saw player
  RETURNING, // Going back to office
}

export interface Boss extends Entity {
  state: BossState;
  stateTimer: number;
  targetPos: Position | null;
  phrase: string | null;
  phraseTimer: number;
}

export interface CoffeeLady extends Entity {
  patrolIndex: number;
  waitTime: number;
}

export interface GameContextType {
  score: number;
  gameState: GameState;
  bossPhrase: string | null;
  startGame: () => void;
  resetGame: () => void;
  setGameOver: (finalPhrase: string) => void;
}