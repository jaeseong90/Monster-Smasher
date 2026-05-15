"use client";

import { create } from "zustand";
import type { Role, WeaponId } from "./store";

type Channel = any;
type SupabaseClient = any;

export interface RemotePlayer {
  id: string;
  role: Role;
  name: string;
  x: number;
  z: number;
  rot: number;
  hp: number;
  weapon: WeaponId;
  lastSeen: number;
}

export interface RemoteMonsterState {
  id: number;
  x: number;
  z: number;
  rot: number;
  hp: number;
  type: string;
}

export interface AttackEvent {
  from: string;
  weapon: WeaponId;
  x: number;
  z: number;
  dirX: number;
  dirZ: number;
  t: number;
}

export interface HitEvent {
  from: string;
  monsterId: number;
  damage: number;
  knockX: number;
  knockZ: number;
  killed: boolean;
}

export interface DeathEvent {
  from: string;
  reason: string;
}

export interface NetState {
  enabled: boolean;
  connected: boolean;
  roomCode: string;
  myId: string;
  myName: string;
  myRole: Role;
  isHost: boolean;
  remote?: RemotePlayer;
  channel?: Channel;
  client?: SupabaseClient;
  worldSeed: number;
  attacks: AttackEvent[];
  setName: (n: string) => void;
  setRole: (r: Role) => void;
  ensureClient: () => Promise<SupabaseClient | null>;
  hostRoom: (code: string) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  leave: () => void;
  broadcastSelf: (s: { x: number; z: number; rot: number; hp: number; weapon: WeaponId }) => void;
  broadcastAttack: (a: AttackEvent) => void;
  broadcastHit: (h: HitEvent) => void;
  broadcastMonsters: (list: RemoteMonsterState[]) => void;
  onMonsters?: (list: RemoteMonsterState[]) => void;
  onAttack?: (a: AttackEvent) => void;
  onHit?: (h: HitEvent) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const useNet = create<NetState>((set, get) => ({
  enabled: false,
  connected: false,
  roomCode: "",
  myId: uid(),
  myName: "플레이어",
  myRole: "husband",
  isHost: false,
  worldSeed: 0,
  attacks: [],
  setName: (n) => set({ myName: n }),
  setRole: (r) => set({ myRole: r }),

  ensureClient: async () => {
    if (get().client) return get().client!;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      console.warn("[net] Supabase env not set — multiplayer disabled");
      return null;
    }
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(url, anon, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
    set({ client });
    return client;
  },

  hostRoom: async (code) => {
    const client = await get().ensureClient();
    if (!client) {
      set({ enabled: false, roomCode: code, isHost: true, connected: false });
      return;
    }
    const channel = client.channel(`room:${code}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: get().myId } },
    });
    wireChannel(channel, get, set, true);
    const seed = Math.floor(Math.random() * 1e9);
    set({ channel, roomCode: code, isHost: true, enabled: true, worldSeed: seed });
    await channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ id: get().myId, name: get().myName, role: get().myRole });
        set({ connected: true });
      }
    });
  },

  joinRoom: async (code) => {
    const client = await get().ensureClient();
    if (!client) {
      set({ enabled: false, roomCode: code, isHost: false, connected: false });
      return;
    }
    const channel = client.channel(`room:${code}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: get().myId } },
    });
    wireChannel(channel, get, set, false);
    set({ channel, roomCode: code, isHost: false, enabled: true });
    await channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ id: get().myId, name: get().myName, role: get().myRole });
        set({ connected: true });
        channel.send({ type: "broadcast", event: "hello", payload: { id: get().myId } });
      }
    });
  },

  leave: () => {
    const ch = get().channel;
    if (ch) ch.unsubscribe();
    set({ channel: undefined, connected: false, enabled: false, remote: undefined });
  },

  broadcastSelf: (s) => {
    const ch = get().channel;
    if (!ch || !get().connected) return;
    ch.send({
      type: "broadcast",
      event: "player",
      payload: { id: get().myId, name: get().myName, role: get().myRole, ...s, t: Date.now() },
    });
  },

  broadcastAttack: (a) => {
    const ch = get().channel;
    if (!ch || !get().connected) return;
    ch.send({ type: "broadcast", event: "attack", payload: a });
  },

  broadcastHit: (h) => {
    const ch = get().channel;
    if (!ch || !get().connected) return;
    ch.send({ type: "broadcast", event: "hit", payload: h });
  },

  broadcastMonsters: (list) => {
    const ch = get().channel;
    if (!ch || !get().connected || !get().isHost) return;
    ch.send({ type: "broadcast", event: "monsters", payload: { list, t: Date.now() } });
  },
}));

function wireChannel(channel: any, get: () => NetState, set: (p: Partial<NetState>) => void, isHost: boolean) {
  channel.on("broadcast", { event: "player" }, (msg: any) => {
    const p = msg.payload;
    if (p.id === get().myId) return;
    set({
      remote: {
        id: p.id,
        role: p.role,
        name: p.name,
        x: p.x,
        z: p.z,
        rot: p.rot,
        hp: p.hp,
        weapon: p.weapon,
        lastSeen: Date.now(),
      },
    });
  });
  channel.on("broadcast", { event: "attack" }, (msg: any) => {
    const fn = get().onAttack;
    if (fn) fn(msg.payload);
  });
  channel.on("broadcast", { event: "hit" }, (msg: any) => {
    const fn = get().onHit;
    if (fn) fn(msg.payload);
  });
  channel.on("broadcast", { event: "monsters" }, (msg: any) => {
    const fn = get().onMonsters;
    if (fn && !get().isHost) fn(msg.payload.list);
  });
  channel.on("broadcast", { event: "hello" }, () => {
    if (isHost) {
      const seed = get().worldSeed;
      channel.send({ type: "broadcast", event: "seed", payload: { seed } });
    }
  });
  channel.on("broadcast", { event: "seed" }, (msg: any) => {
    if (!isHost) set({ worldSeed: msg.payload.seed });
  });
}
