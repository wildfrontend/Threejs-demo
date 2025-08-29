export const BULLET_SPEED = 10; // units/sec
export const BULLET_RANGE = 5; // default shooting range (units)
export const FIRE_COOLDOWN = 0.25; // seconds between shots while firing
export const AUTO_FIRE_INTERVAL = 2.0; // seconds between auto shots
export const MUZZLE_OFFSET = 1.2; // forward offset from player origin
export const MUZZLE_HEIGHT = 1.3; // y offset when spawning bullets
export const BULLET_SIZE = 0.08; // visual bullet radius (smaller)
export const AMMO_CAPACITY = 5; // total bullets available
export const RELOAD_TIME = 3; // seconds to auto-reload
export const COLLISION_RADIUS = 1; // visualized player collision/aggro radius (tight)
export const HIT_BOUNCE_BACK = 0.3; // monster bounce-back distance when hitting hit-range (closer)
export const HIT_BOUNCE_PAUSE = 1.0; // seconds paused after a bounce
export const BOUNCE_RETREAT_SPEED_MULTIPLIER = 0.4; // speed multiplier during bounce retreat phase
export const BOUNCE_RANDOM_ANGLE = 0.4; // random angle variation for bounce direction (±radians)
export const MAX_ZOMBIES = 3; // total concurrent zombies in the scene
export const ZOMBIE_SPEED = 1.4; // default zombie speed (units/sec)
// XP/Leveling config
export const XP_PER_KILL = 1; // XP per zombie kill
export const XP_BASE = 3; // XP needed for level 1->2
export const XP_STEP = 2; // Additional XP needed added per next level
export const MAX_LEVEL = 15; // maximum achievable level
// Shooting fan spread (degrees between adjacent bullets)
export const BULLET_SPREAD_DEG = 10;
