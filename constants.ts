
// Canvas Dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Colors
export const COLORS = {
  FLOOR: '#e4e4e7', // Zinc 200 - Lighter for floor contrast
  FLOOR_SHADOW: '#d4d4d8', 
  WALL: '#52525b', // Zinc 600
  WALL_SIDE: '#3f3f46',
  WALL_TOP: '#71717a',
  DESK: '#b45309', // Amber 700
  PLAYER: '#3b82f6', // Blue 500
  BOSS: '#ef4444', // Red 500
  COFFEE_LADY: '#ec4899', // Pink 500
  SAFE_ZONE: '#d1fae5', // Green 100
  BOSS_ROOM: '#fee2e2', // Red 100
};

// Gameplay Settings
export const PLAYER_SPEED = 2;
export const PLAYER_CROUCH_SPEED = 1;
export const BOSS_SPEED = 1.6; 
export const COFFEE_LADY_SPEED = 0.75;

export const BOSS_SEARCH_DURATION = 30 * 60; // 30 seconds @ 60fps
export const BOSS_VIEW_DISTANCE = 250;
export const BOSS_VIEW_ANGLE = Math.PI / 3; // 60 degrees

// Phrases
export const BOSS_PHRASES = [
  "Need same last week sheet!",
  "Buy Ice Cream to my Dog!",
  "I Need round paper!",
  "I need a feedback!",
  "Get pocket lint for me!",
  "Where is the synergy?",
  "Let's circle back!",
  "We need to pivot!",
  "Think outside the box!",
  "Is this scalable?",
  "I need this ASAP!",
];

// Map Layout
export const WALL_THICKNESS = 10;
export const DOOR_WIDTH = 50;

export const ROOMS = {
  BOSS_OFFICE: { x: 300, y: 0, width: 200, height: 100 },
  PANTRY: { x: 0, y: 0, width: 150, height: 150 },
  RESTROOM: { x: 650, y: 0, width: 150, height: 150 },
  EXIT: { x: 350, y: 580, width: 100, height: 20 },
};

export const DESKS = [
  { x: 150, y: 200, width: 120, height: 80 }, // Top Left
  { x: 530, y: 200, width: 120, height: 80 }, // Top Right
  { x: 150, y: 400, width: 120, height: 80 }, // Bottom Left
  { x: 530, y: 400, width: 120, height: 80 }, // Bottom Right
];

export const COFFEE_PATH = [
  { x: 100, y: 300 },
  { x: 300, y: 300 },
  { x: 500, y: 300 },
  { x: 700, y: 300 },
  { x: 700, y: 500 },
  { x: 400, y: 500 },
  { x: 100, y: 500 },
];
