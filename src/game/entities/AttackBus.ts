import { create } from "zustand";
import type { WeaponId } from "../store";

export interface AttackPing {
  id: number;
  from: "me" | "remote";
  weapon: WeaponId;
  x: number;
  z: number;
  dirX: number;
  dirZ: number;
  t: number;
  consumed: boolean;
}

interface BusState {
  pings: AttackPing[];
  push: (a: Omit<AttackPing, "id" | "consumed">) => void;
  consume: (id: number) => void;
  prune: () => void;
}

let idCounter = 0;

export const useAttackBus = create<BusState>((set) => ({
  pings: [],
  push: (a) =>
    set((s) => ({ pings: [...s.pings.slice(-40), { ...a, id: ++idCounter, consumed: false }] })),
  consume: (id) => set((s) => ({ pings: s.pings.map((p) => (p.id === id ? { ...p, consumed: true } : p)) })),
  prune: () => set((s) => ({ pings: s.pings.filter((p) => performance.now() - p.t < 400) })),
}));
