import { create } from "zustand";

interface ShakeState {
  intensity: number;
  add: (n: number) => void;
  consume: (dt: number) => number;
}

export const useShake = create<ShakeState>((set, get) => ({
  intensity: 0,
  add: (n) => set((s) => ({ intensity: Math.min(1.5, s.intensity + n) })),
  consume: (dt) => {
    const v = get().intensity;
    if (v <= 0) return 0;
    set({ intensity: Math.max(0, v - dt * 2.5) });
    return v;
  },
}));
