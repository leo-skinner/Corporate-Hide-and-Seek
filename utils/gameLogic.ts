import { Position, Size, Entity, Boss } from '../types';
import { BOSS_VIEW_DISTANCE, BOSS_VIEW_ANGLE } from '../constants';

export const checkCollision = (
  rect1: { pos: Position; size: Size },
  rect2: { pos: Position; size: Size }
): boolean => {
  return (
    rect1.pos.x < rect2.pos.x + rect2.size.width &&
    rect1.pos.x + rect1.size.width > rect2.pos.x &&
    rect1.pos.y < rect2.pos.y + rect2.size.height &&
    rect1.pos.y + rect1.size.height > rect2.pos.y
  );
};

export const getDistance = (p1: Position, p2: Position): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const getAngle = (from: Position, to: Position): number => {
  return Math.atan2(to.y - from.y, to.x - from.x);
};

// Line Line Intersection for Raycasting
const lineIntersect = (
  p1: Position,
  p2: Position,
  p3: Position,
  p4: Position
): boolean => {
  const denominator =
    (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (denominator === 0) return false;

  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
    denominator;
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
    denominator;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
};

// Check if Boss can see Player
export const canBossSeePlayer = (
  boss: Boss,
  player: Entity,
  obstacles: { pos: Position; size: Size }[]
): boolean => {
  const dist = getDistance(boss.pos, player.pos);
  if (dist > BOSS_VIEW_DISTANCE) return false;

  const angleToPlayer = getAngle(boss.pos, player.pos);
  let angleDiff = angleToPlayer - boss.angle;
  
  // Normalize angle to -PI to PI
  while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

  if (Math.abs(angleDiff) > BOSS_VIEW_ANGLE / 2) return false;

  // Raycast checks against obstacles
  const bossCenter = {
    x: boss.pos.x + boss.size.width / 2,
    y: boss.pos.y + boss.size.height / 2,
  };
  const playerCenter = {
    x: player.pos.x + player.size.width / 2,
    y: player.pos.y + player.size.height / 2,
  };

  for (const obs of obstacles) {
    // Check intersection with all 4 sides of the obstacle
    // Top
    if (lineIntersect(bossCenter, playerCenter, obs.pos, { x: obs.pos.x + obs.size.width, y: obs.pos.y })) return false;
    // Bottom
    if (lineIntersect(bossCenter, playerCenter, { x: obs.pos.x, y: obs.pos.y + obs.size.height }, { x: obs.pos.x + obs.size.width, y: obs.pos.y + obs.size.height })) return false;
    // Left
    if (lineIntersect(bossCenter, playerCenter, obs.pos, { x: obs.pos.x, y: obs.pos.y + obs.size.height })) return false;
    // Right
    if (lineIntersect(bossCenter, playerCenter, { x: obs.pos.x + obs.size.width, y: obs.pos.y }, { x: obs.pos.x + obs.size.width, y: obs.pos.y + obs.size.height })) return false;
  }

  return true;
};
