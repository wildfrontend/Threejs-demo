"use client";

import { create } from "zustand";
import { AMMO_CAPACITY, COLLISION_RADIUS } from "@/config/gameplay";

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
};

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
  addKill: () => set(() => ({ kills: get().kills + 1 })),
  resetKills: () => set(() => ({ kills: 0 })),
}));
