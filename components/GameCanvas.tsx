
import React, { useEffect, useRef, useMemo } from 'react';
import {
  GameState,
  EntityType,
  Player,
  Boss,
  BossState,
  CoffeeLady,
} from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  DESKS,
  ROOMS,
  PLAYER_SPEED,
  PLAYER_CROUCH_SPEED,
  BOSS_SPEED,
  COFFEE_LADY_SPEED,
  BOSS_SEARCH_DURATION,
  BOSS_PHRASES,
  COFFEE_PATH,
  BOSS_VIEW_ANGLE,
  BOSS_VIEW_DISTANCE,
  WALL_THICKNESS,
  DOOR_WIDTH,
} from '../constants';
import { checkCollision, canBossSeePlayer } from '../utils/gameLogic';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: React.SetStateAction<number>) => void;
  setGameOverPhrase: (phrase: string) => void;
}

// Isometric Constants
const ISO_SCALE = 0.55;
const ISO_OFFSET_X = CANVAS_WIDTH / 2;
const ISO_OFFSET_Y = 50;

// Helper: Projection
const toIso = (x: number, y: number, z: number = 0) => {
  return {
    x: (x - y) * ISO_SCALE + ISO_OFFSET_X,
    y: ((x + y) * 0.5 - z) * ISO_SCALE + ISO_OFFSET_Y,
  };
};

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  setScore,
  setGameOverPhrase,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Input State
  const keys = useRef<{ [key: string]: boolean }>({});

  // Game Entities State
  const playerRef = useRef<Player>({
    id: 'hero',
    type: EntityType.PLAYER,
    pos: { x: 400, y: 300 },
    size: { width: 30, height: 30 },
    velocity: { x: 0, y: 0 },
    speed: PLAYER_SPEED,
    color: COLORS.PLAYER,
    angle: 0,
    isCrouching: false,
  });

  const bossRef = useRef<Boss>({
    id: 'boss',
    type: EntityType.BOSS,
    pos: { x: 400, y: 50 },
    size: { width: 32, height: 32 },
    velocity: { x: 0, y: 0 },
    speed: BOSS_SPEED,
    color: COLORS.BOSS,
    angle: Math.PI / 2,
    state: BossState.IDLE,
    stateTimer: 0,
    targetPos: null,
    phrase: null,
    phraseTimer: 0,
  });

  const coffeeLadyRef = useRef<CoffeeLady>({
    id: 'coffeelady',
    type: EntityType.COFFEE_LADY,
    pos: { x: 100, y: 300 },
    size: { width: 28, height: 28 },
    velocity: { x: 0, y: 0 },
    speed: COFFEE_LADY_SPEED,
    color: COLORS.COFFEE_LADY,
    angle: 0,
    patrolIndex: 0,
    waitTime: 0,
  });

  const startTimeRef = useRef<number>(0);

  // Generate Static Map Objects (Walls)
  const mapWalls = useMemo(() => {
    const walls: Array<{x: number, y: number, w: number, h: number, z: number, color: string}> = [];
    const h = 100; // Wall Height

    // Outer Bounds (Back and Left only for visibility)
    walls.push({ x: -10, y: -10, w: 820, h: 10, z: h, color: COLORS.WALL }); // Top
    walls.push({ x: -10, y: -10, w: 10, h: 620, z: h, color: COLORS.WALL }); // Left

    // Boss Room
    walls.push({ x: ROOMS.BOSS_OFFICE.x, y: 0, w: WALL_THICKNESS, h: ROOMS.BOSS_OFFICE.height, z: h, color: COLORS.WALL }); // West
    walls.push({ x: ROOMS.BOSS_OFFICE.x + ROOMS.BOSS_OFFICE.width - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: ROOMS.BOSS_OFFICE.height, z: h, color: COLORS.WALL }); // East
    // Boss Door Split
    walls.push({ x: ROOMS.BOSS_OFFICE.x, y: ROOMS.BOSS_OFFICE.height, w: 80, h: WALL_THICKNESS, z: h, color: COLORS.WALL });
    walls.push({ x: ROOMS.BOSS_OFFICE.x + 120, y: ROOMS.BOSS_OFFICE.height, w: 80, h: WALL_THICKNESS, z: h, color: COLORS.WALL });

    // Pantry
    walls.push({ x: ROOMS.PANTRY.width - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: ROOMS.PANTRY.height, z: h, color: COLORS.WALL }); // East
    // Pantry Door Split
    walls.push({ x: 0, y: ROOMS.PANTRY.height, w: 50, h: WALL_THICKNESS, z: h, color: COLORS.WALL });
    walls.push({ x: 100, y: ROOMS.PANTRY.height, w: 50, h: WALL_THICKNESS, z: h, color: COLORS.WALL });

    // Restroom
    walls.push({ x: ROOMS.RESTROOM.x, y: 0, w: WALL_THICKNESS, h: ROOMS.RESTROOM.height, z: h, color: COLORS.WALL }); // West
    // Restroom Door Split
    walls.push({ x: ROOMS.RESTROOM.x, y: ROOMS.RESTROOM.height, w: 50, h: WALL_THICKNESS, z: h, color: COLORS.WALL });
    walls.push({ x: ROOMS.RESTROOM.x + 100, y: ROOMS.RESTROOM.height, w: 50, h: WALL_THICKNESS, z: h, color: COLORS.WALL });

    return walls;
  }, []);

  const initGame = () => {
    playerRef.current = {
      ...playerRef.current,
      pos: { x: 400, y: 300 },
      isCrouching: false,
    };
    bossRef.current = {
      ...bossRef.current,
      pos: { x: 380, y: 40 },
      state: BossState.IDLE,
      stateTimer: Math.random() * 200 + 100,
      targetPos: null,
      phrase: null,
    };
    startTimeRef.current = Date.now();
    setScore(0);
  };

  useEffect(() => {
    if (gameState === GameState.START) {
      initGame();
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === 'Space' && gameState === GameState.PLAYING) {
        playerRef.current.isCrouching = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
      if (e.code === 'Space') {
        playerRef.current.isCrouching = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Game Loop
  useEffect(() => {
    const update = () => {
      if (gameState !== GameState.PLAYING) return;

      const player = playerRef.current;
      const boss = bossRef.current;
      const coffeeLady = coffeeLadyRef.current;

      setScore(Math.floor((Date.now() - startTimeRef.current) / 1000));

      // Player Movement
      player.velocity = { x: 0, y: 0 };
      const currentSpeed = player.isCrouching ? PLAYER_CROUCH_SPEED : PLAYER_SPEED;

      if (keys.current['ArrowUp'] || keys.current['KeyW']) player.velocity.y = -currentSpeed;
      if (keys.current['ArrowDown'] || keys.current['KeyS']) player.velocity.y = currentSpeed;
      if (keys.current['ArrowLeft'] || keys.current['KeyA']) player.velocity.x = -currentSpeed;
      if (keys.current['ArrowRight'] || keys.current['KeyD']) player.velocity.x = currentSpeed;

      let nextX = player.pos.x + player.velocity.x;
      let nextY = player.pos.y + player.velocity.y;
      nextX = Math.max(0, Math.min(CANVAS_WIDTH - player.size.width, nextX));
      nextY = Math.max(0, Math.min(CANVAS_HEIGHT - player.size.height, nextY));

      const tempPlayerX = { ...player, pos: { x: nextX, y: player.pos.y } };
      const tempPlayerY = { ...player, pos: { x: player.pos.x, y: nextY } };
      
      let collidedX = false;
      let collidedY = false;

      // Collisions against Desks
      DESKS.forEach(desk => {
        if (checkCollision(tempPlayerX, { pos: { x: desk.x, y: desk.y }, size: { width: desk.width, height: desk.height } })) collidedX = true;
        if (checkCollision(tempPlayerY, { pos: { x: desk.x, y: desk.y }, size: { width: desk.width, height: desk.height } })) collidedY = true;
      });

      // Collisions against Walls
      mapWalls.forEach(wall => {
        if (checkCollision(tempPlayerX, { pos: { x: wall.x, y: wall.y }, size: { width: wall.w, height: wall.h } })) collidedX = true;
        if (checkCollision(tempPlayerY, { pos: { x: wall.x, y: wall.y }, size: { width: wall.w, height: wall.h } })) collidedY = true;
      });

      if (!collidedX) player.pos.x = nextX;
      if (!collidedY) player.pos.y = nextY;

      if (player.velocity.x !== 0 || player.velocity.y !== 0) {
        player.angle = Math.atan2(player.velocity.y, player.velocity.x);
      }

      // Coffee Lady
      if (coffeeLady.waitTime > 0) {
        coffeeLady.waitTime--;
      } else {
        const target = COFFEE_PATH[coffeeLady.patrolIndex];
        const dx = target.x - coffeeLady.pos.x;
        const dy = target.y - coffeeLady.pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < COFFEE_LADY_SPEED) {
          coffeeLady.pos.x = target.x;
          coffeeLady.pos.y = target.y;
          coffeeLady.patrolIndex = (coffeeLady.patrolIndex + 1) % COFFEE_PATH.length;
          coffeeLady.waitTime = 60;
        } else {
          coffeeLady.pos.x += (dx / dist) * COFFEE_LADY_SPEED;
          coffeeLady.pos.y += (dy / dist) * COFFEE_LADY_SPEED;
        }
      }

      // Boss Logic
      if (boss.phraseTimer > 0) boss.phraseTimer--;
      else boss.phrase = null;

      switch (boss.state) {
        case BossState.IDLE:
          boss.stateTimer--;
          if (boss.stateTimer <= 0) {
            boss.state = BossState.SEARCHING;
            boss.stateTimer = BOSS_SEARCH_DURATION;
            boss.phrase = BOSS_PHRASES[Math.floor(Math.random() * BOSS_PHRASES.length)];
            boss.phraseTimer = 180;
            boss.targetPos = { x: 400, y: 200 };
          }
          break;

        case BossState.SEARCHING:
          boss.stateTimer--;
          if (!boss.targetPos) {
             boss.targetPos = {
               x: 50 + Math.random() * (CANVAS_WIDTH - 100),
               y: 150 + Math.random() * (CANVAS_HEIGHT - 200)
             };
          }

          const dx = boss.targetPos.x - boss.pos.x;
          const dy = boss.targetPos.y - boss.pos.y;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist < BOSS_SPEED) {
             boss.pos.x = boss.targetPos.x;
             boss.pos.y = boss.targetPos.y;
             boss.targetPos = null;
          } else {
            boss.velocity.x = (dx / dist) * BOSS_SPEED;
            boss.velocity.y = (dy / dist) * BOSS_SPEED;
            boss.pos.x += boss.velocity.x;
            boss.pos.y += boss.velocity.y;
            boss.angle = Math.atan2(dy, dx);
          }

          const obstacles = DESKS.map(d => ({ pos: { x: d.x, y: d.y }, size: { width: d.width, height: d.height } }));
          
          if (canBossSeePlayer(boss, player, obstacles)) {
             const inPantry = checkCollision(player, { pos: { x: ROOMS.PANTRY.x, y: ROOMS.PANTRY.y }, size: { width: ROOMS.PANTRY.width, height: ROOMS.PANTRY.height } });
             const inRestroom = checkCollision(player, { pos: { x: ROOMS.RESTROOM.x, y: ROOMS.RESTROOM.y }, size: { width: ROOMS.RESTROOM.width, height: ROOMS.RESTROOM.height } });
             
             if (!inPantry && !inRestroom) {
               setGameState(GameState.GAME_OVER);
               setGameOverPhrase(boss.phrase || "Gotcha!");
             }
          }

          if (boss.stateTimer <= 0) {
            boss.state = BossState.RETURNING;
            boss.targetPos = { x: 380, y: 40 };
            boss.phrase = "Back to strategy...";
            boss.phraseTimer = 120;
          }
          break;

        case BossState.RETURNING:
          if (boss.targetPos) {
            const rdx = boss.targetPos.x - boss.pos.x;
            const rdy = boss.targetPos.y - boss.pos.y;
            const rdist = Math.sqrt(rdx*rdx + rdy*rdy);
            
            if (rdist < BOSS_SPEED) {
              boss.pos.x = boss.targetPos.x;
              boss.pos.y = boss.targetPos.y;
              boss.state = BossState.IDLE;
              boss.stateTimer = Math.random() * 300 + 200;
            } else {
               boss.pos.x += (rdx / rdist) * BOSS_SPEED;
               boss.pos.y += (rdy / rdist) * BOSS_SPEED;
               boss.angle = Math.atan2(rdy, rdx);
            }
          }
          break;
      }
    };

    const drawIsoCube = (
      ctx: CanvasRenderingContext2D,
      x: number, y: number, w: number, h: number, z: number,
      color: string,
      skipTop: boolean = false
    ) => {
      const p1 = toIso(x, y, 0); // Bottom Back
      const p2 = toIso(x + w, y, 0); // Bottom Right
      const p3 = toIso(x + w, y + h, 0); // Bottom Front
      const p4 = toIso(x, y + h, 0); // Bottom Left

      const t1 = toIso(x, y, z); // Top Back
      const t2 = toIso(x + w, y, z); // Top Right
      const t3 = toIso(x + w, y + h, z); // Top Front
      const t4 = toIso(x, y + h, z); // Top Left

      // Shadows / Sides
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';

      // Right Face (Southeast)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.closePath();
      ctx.fill();
      // Shade
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();

      // Front Face (Southwest)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.lineTo(t4.x, t4.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fill();
      // Shade
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();

      // Top Face
      if (!skipTop) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.lineTo(t4.x, t4.y);
        ctx.closePath();
        ctx.fill();
        // Highlight border
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();
      }
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear & Background
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#111'; // Dark background for contrast
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // --- Draw Isometric Floor ---
      // Main Floor
      const floorP1 = toIso(0, 0);
      const floorP2 = toIso(CANVAS_WIDTH, 0);
      const floorP3 = toIso(CANVAS_WIDTH, CANVAS_HEIGHT);
      const floorP4 = toIso(0, CANVAS_HEIGHT);

      ctx.fillStyle = COLORS.FLOOR;
      ctx.beginPath();
      ctx.moveTo(floorP1.x, floorP1.y);
      ctx.lineTo(floorP2.x, floorP2.y);
      ctx.lineTo(floorP3.x, floorP3.y);
      ctx.lineTo(floorP4.x, floorP4.y);
      ctx.closePath();
      ctx.fill();
      
      // Draw Rooms Floor Colors
      const drawRoomFloor = (room: any, color: string, label: string) => {
        const rp1 = toIso(room.x, room.y);
        const rp2 = toIso(room.x + room.width, room.y);
        const rp3 = toIso(room.x + room.width, room.y + room.height);
        const rp4 = toIso(room.x, room.y + room.height);
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(rp1.x, rp1.y);
        ctx.lineTo(rp2.x, rp2.y);
        ctx.lineTo(rp3.x, rp3.y);
        ctx.lineTo(rp4.x, rp4.y);
        ctx.closePath();
        ctx.fill();

        // Label
        const center = toIso(room.x + room.width/2, room.y + room.height/2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(label, center.x, center.y);
      };

      drawRoomFloor(ROOMS.BOSS_OFFICE, COLORS.BOSS_ROOM, "BOSS");
      drawRoomFloor(ROOMS.PANTRY, COLORS.SAFE_ZONE, "PANTRY");
      drawRoomFloor(ROOMS.RESTROOM, COLORS.SAFE_ZONE, "WC");

      // Exit Area
      drawRoomFloor(ROOMS.EXIT, '#000', "");
      const exitPos = toIso(ROOMS.EXIT.x + 50, ROOMS.EXIT.y + 10);
      ctx.fillStyle = '#fff';
      ctx.fillText("EXIT", exitPos.x, exitPos.y);

      // --- Collect Renderables ---
      // We need to sort objects by depth to draw correctly (Painter's Algorithm)
      // Depth = x + y generally works for isometric sort from top-back to bottom-front
      
      interface Renderable {
        type: 'wall' | 'desk' | 'player' | 'boss' | 'npc';
        x: number;
        y: number;
        w: number;
        h: number;
        z: number;
        color: string;
        data?: any;
      }

      const renderList: Renderable[] = [];

      // Add Walls
      mapWalls.forEach(w => {
        renderList.push({ type: 'wall', x: w.x, y: w.y, w: w.w, h: w.h, z: w.z, color: w.color });
      });

      // Add Desks
      DESKS.forEach(d => {
        renderList.push({ type: 'desk', x: d.x, y: d.y, w: d.width, h: d.height, z: 40, color: COLORS.DESK });
      });

      // Add Characters
      const p = playerRef.current;
      renderList.push({ 
        type: 'player', 
        x: p.pos.x, y: p.pos.y, w: p.size.width, h: p.size.height, 
        z: p.isCrouching ? 20 : 50, // Height changes when crouching
        color: p.color,
        data: p
      });

      const b = bossRef.current;
      renderList.push({ 
        type: 'boss', 
        x: b.pos.x, y: b.pos.y, w: b.size.width, h: b.size.height, 
        z: 55, 
        color: b.color,
        data: b
      });

      const c = coffeeLadyRef.current;
      renderList.push({ 
        type: 'npc', 
        x: c.pos.x, y: c.pos.y, w: c.size.width, h: c.size.height, 
        z: 45, 
        color: c.color 
      });

      // SORT
      // Sort by the coordinate that is closest to the camera.
      // In this projection, larger (x+y) is closer.
      renderList.sort((a, b) => {
        const depthA = (a.x + a.w) + (a.y + a.h);
        const depthB = (b.x + b.w) + (b.y + b.h);
        return depthA - depthB;
      });

      // DRAW LOOP
      renderList.forEach(obj => {
        if (obj.type === 'wall') {
          drawIsoCube(ctx, obj.x, obj.y, obj.w, obj.h, obj.z, obj.color);
        }
        else if (obj.type === 'desk') {
          drawIsoCube(ctx, obj.x, obj.y, obj.w, obj.h, obj.z, obj.color);
          // Computer monitor on desk
          drawIsoCube(ctx, obj.x + 40, obj.y + 10, 10, 30, obj.z + 20, '#1e293b');
        }
        else if (obj.type === 'player' || obj.type === 'boss' || obj.type === 'npc') {
          // Draw Character Body
          drawIsoCube(ctx, obj.x, obj.y, obj.w, obj.h, obj.z, obj.color);
          
          // Head
          const headSize = 20;
          const headX = obj.x + (obj.w - headSize)/2;
          const headY = obj.y + (obj.h - headSize)/2;
          const headZ = obj.z + 10;
          
          if (obj.type === 'boss') {
             // Boss Head (Pink skin)
             drawIsoCube(ctx, headX, headY, headSize, headSize, 15, '#fca5a5');
             // Beard
             drawIsoCube(ctx, headX, headY+5, headSize, 5, 5, '#4b5563');
          } else if (obj.type === 'player') {
             // Player Head
             drawIsoCube(ctx, headX, headY, headSize, headSize, 15, '#fca5a5');
             // Hair
             drawIsoCube(ctx, headX, headY, headSize, headSize, 5, '#000');
          } else {
             // Lady Head
             drawIsoCube(ctx, headX, headY, headSize, headSize, 15, '#fca5a5');
          }

          // Boss View Cone (Special Draw overlay on floor)
          if (obj.type === 'boss' && obj.data && obj.data.state === BossState.SEARCHING) {
             // This needs to be drawn flat on floor, but we are in sorted loop.
             // We can draw it relative to boss, or drawing it earlier would be better.
             // Drawing it here might clip into walls if not careful, but okay for debug/gameplay.
             // Actually, cones in iso are ellipses. Hard to draw perfectly.
             // Let's skip the cone fill and just use the "!" emote or line of sight indicator if needed.
             // Or draw a simple circle around feet.
             const feet = toIso(obj.x + obj.w/2, obj.y + obj.h/2, 0);
             ctx.save();
             ctx.translate(feet.x, feet.y);
             ctx.scale(1, 0.5); // Squash circle
             ctx.beginPath();
             ctx.arc(0, 0, BOSS_VIEW_DISTANCE * ISO_SCALE, 0, Math.PI*2);
             ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
             ctx.lineWidth = 2;
             ctx.stroke();
             ctx.restore();
          }

          // Phrase Bubble (2D Overlay)
          if (obj.type === 'boss' && obj.data && obj.data.phrase) {
            const headTop = toIso(obj.x, obj.y, obj.z + 30);
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.font = '10px "Press Start 2P"';
            const textWidth = ctx.measureText(obj.data.phrase).width;
            
            const bx = headTop.x - textWidth/2;
            const by = headTop.y - 40;
            ctx.fillRect(bx - 10, by - 15, textWidth + 20, 25);
            ctx.strokeRect(bx - 10, by - 15, textWidth + 20, 25);
            
            ctx.fillStyle = '#000';
            ctx.fillText(obj.data.phrase, bx, by + 5);
          }
        }
      });
    };

    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameState, setGameState, setScore, setGameOverPhrase, mapWalls]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="shadow-2xl bg-zinc-900 rounded-xl"
    />
  );
};

export default GameCanvas;
