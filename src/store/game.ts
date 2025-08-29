"use client";

import { create } from "zustand";
import {
  AMMO_CAPACITY,
  COLLISION_RADIUS,
  XP_BASE,
  XP_PER_KILL,
  XP_STEP,
  MAX_LEVEL,
  MOVE_SPEED_BASE,
  MOVE_SPEED_STEP,
  BASE_MAX_HEALTH,
} from "@/config/gameplay";

type GameState = {
  maxHealth: number;
  health: number;
  setHealth: (value: number) => void;
  damage: (amount?: number) => void;
  heal: (amount?: number) => void;
  resetHealth: () => void;
  ammoCapacity: number;
  ammo: number;
  setAmmo: (value: number) => void;
  consumeAmmo: (amount?: number) => void;
  reloadAmmo: () => void;
  reloading: boolean;
  setReloading: (value: boolean) => void;
  startReload: () => void;
  hitRadius: number;
  setHitRadius: (value: number) => void;
  kills: number;
  addKill: () => void;
  resetKills: () => void;
  // Pause
  paused: boolean;
  setPaused: (value: boolean) => void;
  togglePaused: () => void;
  // Invincibility ability (unlocked at moveSpeed LV5)
  invincible: boolean;
  invincibleFor: number; // seconds remaining for active invincibility
  invincibleCooldown: number; // seconds remaining for cooldown
  triggerInvincible: () => void;
  updateInvincible: (delta: number) => void;
  // Game lifecycle
  gameOver: boolean;
  resetGame: () => void;
  runId: number; // increment to remount game scene
  // XP / Level
  level: number; // starts at 1
  xp: number; // current XP into this level
  xpToNext: number; // XP needed to reach next level
  addXp: (amount?: number) => void;
  resetXp: () => void;
  upgradePending: number; // number of upgrade choices to make
  applyUpgrade: (kind: "maxHealth" | "bulletDamage" | "bulletCount" | "moveSpeed" | "ammoCapacity") => void;
  // Upgradeable stats
  bulletDamage: number;
  bulletCount: number;
  moveSpeed: number;
  moveSpeedUpgrades: number;
  infiniteAmmo: boolean;
  // Drops (hearts)
  drops: { id: number; kind: 'heart'; position: [number, number, number] }[];
  addHeartDrop: (pos: [number, number, number]) => void;
  removeDrop: (id: number) => void;
  clearDrops: () => void;
};

const xpNeededForLevel = (level: number) => XP_BASE + (level - 1) * XP_STEP;

export const useGame = create<GameState>((set, get) => ({
  maxHealth: 4,
  health: 4,
  setHealth: (value) =>
    set(() => {
      const { maxHealth } = get();
      const clamped = Math.max(0, Math.min(value, maxHealth));
      return { health: clamped };
    }),
  damage: (amount = 1) =>
    set(() => {
      const { health, invincible } = get();
      if (invincible) return {} as any;
      const next = Math.max(0, health - amount);
      const changes: Partial<GameState> = { health: next };
      if (next <= 0) {
        changes.paused = true;
        changes.gameOver = true;
      }
      return changes as any;
    }),
  heal: (amount = 1) =>
    set(() => {
      const { health, maxHealth } = get();
      return { health: Math.min(maxHealth, health + amount) };
    }),
  resetHealth: () =>
    set(() => {
      const { maxHealth } = get();
      return { health: maxHealth };
    }),
  ammoCapacity: AMMO_CAPACITY,
  ammo: AMMO_CAPACITY,
  setAmmo: (value) =>
    set(() => {
      const { ammoCapacity } = get();
      const clamped = Math.max(0, Math.min(value, ammoCapacity));
      return { ammo: clamped };
    }),
  consumeAmmo: (amount = 1) =>
    set(() => {
      const { ammo } = get();
      return { ammo: Math.max(0, ammo - amount) };
    }),
  reloadAmmo: () =>
    set(() => {
      const { ammoCapacity } = get();
      return { ammo: ammoCapacity };
    }),
  reloading: false,
  setReloading: (value) => set(() => ({ reloading: value })),
  startReload: () => set(() => ({ reloading: true })),
  hitRadius: COLLISION_RADIUS,
  setHitRadius: (value) => set(() => ({ hitRadius: Math.max(0.1, value) })),
  kills: 0,
  addKill: () => {
    set(() => ({ kills: get().kills + 1 }));
    // grant XP on kill
    get().addXp(XP_PER_KILL);
  },
  resetKills: () => set(() => ({ kills: 0 })),
  // Pause
  paused: false,
  setPaused: (value) => set(() => ({ paused: !!value })),
  togglePaused: () => set(() => ({ paused: !get().paused })),
  // Invincibility
  invincible: false,
  invincibleFor: 0,
  invincibleCooldown: 0,
  triggerInvincible: () =>
    set(() => {
      const { invincibleCooldown, moveSpeedUpgrades, paused } = get() as any;
      // unlock at LV5 (moveSpeedUpgrades + 1 >= 5)
      const unlocked = (moveSpeedUpgrades ?? 0) + 1 >= 5;
      if (!unlocked || paused || (invincibleCooldown ?? 0) > 0) return {} as any;
      return { invincible: true, invincibleFor: 2.0, invincibleCooldown: 30.0 } as any;
    }),
  updateInvincible: (delta: number) =>
    set(() => {
      let { invincible, invincibleFor, invincibleCooldown } = get() as any;
      if (invincibleCooldown > 0) invincibleCooldown = Math.max(0, invincibleCooldown - delta);
      if (invincible) {
        invincibleFor = Math.max(0, invincibleFor - delta);
        if (invincibleFor <= 0) invincible = false;
      }
      return { invincible, invincibleFor, invincibleCooldown } as any;
    }),
  // Game lifecycle
  gameOver: false,
  runId: 0,
  resetGame: () =>
    set(() => {
      // Reset core stats and flags
      const maxHealth = get().maxHealth;
      const ammoCapacity = get().ammoCapacity;
      return {
        // core
        health: maxHealth,
        ammo: ammoCapacity,
        reloading: false,
        kills: 0,
        paused: false,
        gameOver: false,
        // leveling
        level: 1,
        xp: 0,
        xpToNext: xpNeededForLevel(1),
        upgradePending: 0,
        // upgrades reset
        bulletDamage: 1,
        bulletCount: 1,
        moveSpeedUpgrades: 0,
        moveSpeed: MOVE_SPEED_BASE,
        infiniteAmmo: false,
        invincible: false,
        invincibleFor: 0,
        invincibleCooldown: 0,
        drops: [],
        // remount scene consumers
        runId: get().runId + 1,
      } as any;
    }),
  // Leveling
  level: 1,
  xp: 0,
  xpToNext: xpNeededForLevel(1),
  upgradePending: 0,
  // Upgradeable stats defaults
  bulletDamage: 1,
  bulletCount: 1,
  moveSpeedUpgrades: 0,
  moveSpeed: MOVE_SPEED_BASE,
  infiniteAmmo: false,
  drops: [],
  addHeartDrop: (position) =>
    set(() => {
      const { drops } = get() as any;
      const id = drops && drops.length ? drops[drops.length - 1].id + 1 : 1;
      const next = [...(drops || []), { id, kind: 'heart', position }];
      return { drops: next } as any;
    }),
  removeDrop: (id) =>
    set(() => {
      const { drops } = get() as any;
      return { drops: (drops || []).filter((d: any) => d.id !== id) } as any;
    }),
  clearDrops: () => set(() => ({ drops: [] as any })),
  addXp: (amount = 1) => {
    let { xp, level, xpToNext } = get();
    const prevLevel = level;
    // At cap: enforce cap state and ignore gains
    if (level >= MAX_LEVEL) {
      if (xp !== 0 || xpToNext !== 0) set(() => ({ xp: 0, level: MAX_LEVEL, xpToNext: 0 }));
      return;
    }
    xp += amount;
    let leveledUp = false;
    while (xp >= xpToNext) {
      xp -= xpToNext;
      level += 1;
      leveledUp = true;
      if (level >= MAX_LEVEL) {
        xp = 0;
        xpToNext = 0;
        break;
      }
      xpToNext = xpNeededForLevel(level);
    }
    set(() => ({ xp, level, xpToNext }));
    if (leveledUp && level > prevLevel) {
      const gained = level - prevLevel;
      set(() => ({ paused: true, upgradePending: get().upgradePending + gained }));
    }
  },
  resetXp: () => set(() => ({ level: 1, xp: 0, xpToNext: xpNeededForLevel(1) })),
  applyUpgrade: (kind) =>
    set(() => {
      const s = get();
      let { maxHealth, health, bulletDamage, bulletCount, moveSpeed, ammoCapacity, ammo, upgradePending, paused } = s as any;
      switch (kind) {
        case "maxHealth":
          maxHealth = Math.max(1, (maxHealth ?? 1) + 1);
          // Refill to full when gaining a heart
          health = maxHealth;
          // At LV5, double max health once
          {
            const heartLv = (maxHealth - BASE_MAX_HEALTH) + 1;
            if (heartLv === 5) {
              maxHealth = Math.max(1, maxHealth * 2);
              health = maxHealth;
            }
          }
          break;
        case "bulletDamage":
          bulletDamage = Math.min(5, (bulletDamage ?? 1) + 1);
          break;
        case "bulletCount":
          bulletCount = Math.min(5, Math.max(1, (bulletCount ?? 1) + 1));
          break;
        case "ammoCapacity":
          ammoCapacity = Math.max(1, (ammoCapacity ?? 1) + 1);
          // Refill to the new capacity
          ammo = ammoCapacity;
          // At LV5, grant infinite ammo (no reload / no consumption)
          const ammoLv = (ammoCapacity - AMMO_CAPACITY) + 1;
          if (ammoLv >= 5) {
            (s as any).infiniteAmmo = true;
            (s as any).reloading = false;
          }
          break;
        case "moveSpeed":
          // Use formula: base * (1 + step * count); clamp to LV5 (count<=4)
          const newCountRaw = (s as any).moveSpeedUpgrades + 1;
          const newCount = Math.min(4, newCountRaw);
          moveSpeed = MOVE_SPEED_BASE * (1 + MOVE_SPEED_STEP * newCount);
          return {
            maxHealth,
            health,
            bulletDamage,
            bulletCount,
            moveSpeed,
            moveSpeedUpgrades: newCount,
            upgradePending: Math.max(0, (upgradePending ?? 0) - 1),
            paused: upgradePending - 1 === 0 ? false : paused,
          } as any;
          break;
      }
      upgradePending = Math.max(0, (upgradePending ?? 0) - 1);
      if (upgradePending === 0 && paused) paused = false;
      return { maxHealth, health, bulletDamage, bulletCount, moveSpeed, ammoCapacity, ammo, upgradePending, paused };
    }),
}));
