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
// Monster movement speeds (units/sec)
export const SKELETON_SPEED = 1.0;
export const ZOMBIE_SPEED = 0.75;
export const GHOST_SPEED = 1.0;
export const VAMPIRE_SPEED = 1.2;
// XP/Leveling config
export const XP_PER_KILL = 1; // XP per zombie kill
export const XP_BASE = 3; // XP needed for level 1->2
export const XP_STEP = 2; // Additional XP needed added per next level
export const MAX_LEVEL = 15; // maximum achievable level
// Shooting fan spread (degrees between adjacent bullets)
export const BULLET_SPREAD_DEG = 10;
// Player move speed
export const MOVE_SPEED_BASE = 4.5; // base move speed
export const MOVE_SPEED_STEP = 0.1; // +10% per upgrade
export const BASE_MAX_HEALTH = 4; // hearts at start (for Lv display)
// Enemy projectile speeds
export const GHOST_BULLET_SPEED = 2; // much slower for clearer effect

// Monster stats
export const SKELETON_HP = 2;
export const SKELETON_ATTACK = 1;

export const ZOMBIE_HP = 6;
export const ZOMBIE_ATTACK = 2;

export const GHOST_HP = 3;
export const GHOST_ATTACK = 1;
export const GHOST_ATTACK_RANGE = 5;

export const VAMPIRE_HP = 50;
export const VAMPIRE_ATTACK = 3;
export const VAMPIRE_ATTACK_RANGE = 2;
export const VAMPIRE_BULLET_DAMAGE = 1;
export const VAMPIRE_BULLET_SPEED = 8; // vampire projectile speed (units/sec)

// Generic attack cooldown for ranged/contact (seconds)
export const MONSTER_ATTACK_COOLDOWN = 1.0;
