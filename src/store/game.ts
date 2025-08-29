"use client";

import { create } from "zustand";
import {
  AMMO_CAPACITY,
  COLLISION_RADIUS,
  XP_BASE,
  XP_PER_KILL,
  XP_STEP,
  MAX_LEVEL,
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
  // XP / Level
  level: number; // starts at 1
  xp: number; // current XP into this level
  xpToNext: number; // XP needed to reach next level
  addXp: (amount?: number) => void;
  resetXp: () => void;
  upgradePending: number; // number of upgrade choices to make
  applyUpgrade: (kind: "maxHealth" | "bulletDamage" | "bulletCount" | "moveSpeed") => void;
  // Upgradeable stats
  bulletDamage: number;
  bulletCount: number;
  moveSpeed: number;
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
      const { health } = get();
      return { health: Math.max(0, health - amount) };
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
  // Leveling
  level: 1,
  xp: 0,
  xpToNext: xpNeededForLevel(1),
  upgradePending: 0,
  // Upgradeable stats defaults
  bulletDamage: 1,
  bulletCount: 1,
  moveSpeed: 6,
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
      let { maxHealth, health, bulletDamage, bulletCount, moveSpeed, upgradePending, paused } = s as any;
      switch (kind) {
        case "maxHealth":
          maxHealth = Math.max(1, (maxHealth ?? 1) + 1);
          // Refill to full when gaining a heart
          health = maxHealth;
          break;
        case "bulletDamage":
          bulletDamage = (bulletDamage ?? 1) + 1;
          break;
        case "bulletCount":
          bulletCount = Math.max(1, (bulletCount ?? 1) + 1);
          break;
        case "moveSpeed":
          moveSpeed = (moveSpeed ?? 6) * 1.1;
          break;
      }
      upgradePending = Math.max(0, (upgradePending ?? 0) - 1);
      if (upgradePending === 0 && paused) paused = false;
      return { maxHealth, health, bulletDamage, bulletCount, moveSpeed, upgradePending, paused };
    }),
}));
