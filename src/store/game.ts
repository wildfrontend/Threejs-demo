"use client";

import { create } from "zustand";

type GameState = {
  maxHealth: number;
  health: number;
  setHealth: (value: number) => void;
  damage: (amount?: number) => void;
  heal: (amount?: number) => void;
  resetHealth: () => void;
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
}));

