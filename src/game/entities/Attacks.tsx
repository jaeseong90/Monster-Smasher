"use client";

import { create } from "zustand";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { WeaponId } from "../store";
import { WEAPONS } from "../store";
import { boom, flame, squeak } from "../sounds";
import { useShake } from "../camera";
import { haptic, hapticPattern } from "../haptics";

export interface VisualSwing {
  id: number;
  origin: [number, number, number];
  dir: [number, number];
  owner: "me" | "remote";
  weapon: WeaponId;
  born: number;
  ttl: number;
}

export interface VisualProjectile {
  id: number;
  pos: [number, number, number];
  vel: [number, number];
  owner: "me" | "remote";
  weapon: WeaponId;
  born: number;
  ttl: number;
  exploded: boolean;
}

export interface VisualExplosion {
  id: number;
  pos: [number, number, number];
  radius: number;
  born: number;
  ttl: number;
}

export interface VisualFlame {
  id: number;
  origin: [number, number, number];
  dir: [number, number];
  owner: "me" | "remote";
  born: number;
  ttl: number;
}

interface AttackState {
  swings: VisualSwing[];
  projectiles: VisualProjectile[];
  explosions: VisualExplosion[];
  flames: VisualFlame[];
}

let idc = 0;

export const attackStore = create<AttackState>(() => ({
  swings: [],
  projectiles: [],
  explosions: [],
  flames: [],
}));

const store = attackStore;

export function useAttacks() {
  return attackStore();
}

export function spawnSwing(opts: { origin: [number, number, number]; dir: [number, number]; owner: "me" | "remote"; weapon: WeaponId }) {
  const s: VisualSwing = { ...opts, id: ++idc, born: performance.now(), ttl: 250 };
  store.setState((p) => ({ swings: [...p.swings.slice(-40), s] }));
  if (opts.owner === "me") {
    useShake.getState().add(0.15);
    haptic("light");
  }
}

export function spawnProjectile(opts: { origin: [number, number, number]; dir: [number, number]; owner: "me" | "remote"; weapon: WeaponId }) {
  const p: VisualProjectile = {
    id: ++idc,
    pos: [...opts.origin] as [number, number, number],
    vel: [opts.dir[0] * 18, opts.dir[1] * 18],
    owner: opts.owner,
    weapon: opts.weapon,
    born: performance.now(),
    ttl: 1500,
    exploded: false,
  };
  store.setState((s) => ({ projectiles: [...s.projectiles.slice(-30), p] }));
}

export function spawnExplosion(pos: [number, number, number], radius: number) {
  const e: VisualExplosion = { id: ++idc, pos, radius, born: performance.now(), ttl: 500 };
  store.setState((s) => ({ explosions: [...s.explosions.slice(-30), e] }));
  boom();
  useShake.getState().add(0.8);
  hapticPattern([20, 30, 40]);
}

export function spawnFlame(opts: { origin: [number, number, number]; dir: [number, number]; owner: "me" | "remote" }) {
  const f: VisualFlame = { ...opts, id: ++idc, born: performance.now(), ttl: 200 };
  store.setState((s) => ({ flames: [...s.flames.slice(-50), f] }));
  flame();
}

export function spawnSqueak(pos: [number, number, number]) {
  squeak();
  const e: VisualExplosion = { id: ++idc, pos, radius: 0.6, born: performance.now(), ttl: 220 };
  store.setState((s) => ({ explosions: [...s.explosions.slice(-30), e] }));
}

export function AttackVisuals() {
  const swings = store((s) => s.swings);
  const projectiles = store((s) => s.projectiles);
  const explosions = store((s) => s.explosions);
  const flames = store((s) => s.flames);

  useFrame(() => {
    const now = performance.now();
    const state = store.getState();
    if (
      state.swings.some((s) => now - s.born > s.ttl) ||
      state.projectiles.some((p) => now - p.born > p.ttl) ||
      state.explosions.some((e) => now - e.born > e.ttl) ||
      state.flames.some((f) => now - f.born > f.ttl)
    ) {
      store.setState({
        swings: state.swings.filter((s) => now - s.born <= s.ttl),
        projectiles: state.projectiles.filter((p) => now - p.born <= p.ttl),
        explosions: state.explosions.filter((e) => now - e.born <= e.ttl),
        flames: state.flames.filter((f) => now - f.born <= f.ttl),
      });
    }
  });

  return (
    <group>
      {swings.map((s) => (
        <SwingFX key={s.id} swing={s} />
      ))}
      {projectiles.map((p) => (
        <ProjectileFX key={p.id} proj={p} />
      ))}
      {explosions.map((e) => (
        <ExplosionFX key={e.id} ex={e} />
      ))}
      {flames.map((f) => (
        <FlameFX key={f.id} fl={f} />
      ))}
    </group>
  );
}

function SwingFX({ swing }: { swing: VisualSwing }) {
  const ref = useRef<THREE.Group>(null!);
  const def = WEAPONS[swing.weapon];
  const angle = Math.atan2(swing.dir[0], swing.dir[1]);
  useFrame(() => {
    const t = (performance.now() - swing.born) / swing.ttl;
    if (ref.current) {
      ref.current.scale.setScalar(1 + t * 0.4);
      (ref.current.children[0] as any).material.opacity = 0.6 * (1 - t);
    }
  });
  const color =
    swing.weapon === "pan" ? "#ffcf3a" :
    swing.weapon === "leek" ? "#7eff8e" :
    swing.weapon === "greatsword" ? "#9ee8ff" :
    swing.weapon === "squeaky" ? "#ff7eb6" :
    "#ffd76a";
  return (
    <group position={[swing.origin[0], 0.6, swing.origin[2]]} rotation={[0, angle, 0]}>
      <group ref={ref}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, def.range * 0.4]}>
          <ringGeometry args={[def.range * 0.4, def.range, 16, 1, -def.arc / 2, def.arc]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function ProjectileFX({ proj }: { proj: VisualProjectile }) {
  return (
    <group position={[proj.pos[0], proj.pos[1], proj.pos[2]]}>
      <mesh>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshStandardMaterial color="#ffae3c" emissive="#ff5a1a" emissiveIntensity={1.2} />
      </mesh>
      <pointLight color="#ff8a3c" intensity={6} distance={4} />
    </group>
  );
}

function ExplosionFX({ ex }: { ex: VisualExplosion }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const t = (performance.now() - ex.born) / ex.ttl;
    if (ref.current) {
      const s = (0.2 + t * ex.radius) * 2;
      ref.current.scale.setScalar(s);
      (ref.current.material as any).opacity = 0.7 * (1 - t);
    }
  });
  return (
    <group position={ex.pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffb24a" transparent opacity={0.7} />
      </mesh>
      <pointLight color="#ff7a3a" intensity={12} distance={ex.radius * 4} />
    </group>
  );
}

function FlameFX({ fl }: { fl: VisualFlame }) {
  const ref = useRef<THREE.Mesh>(null!);
  const ang = Math.atan2(fl.dir[0], fl.dir[1]);
  useFrame(() => {
    const t = (performance.now() - fl.born) / fl.ttl;
    if (ref.current) {
      ref.current.scale.set(1 + t, 1, 1 + t * 1.8);
      (ref.current.material as any).opacity = 0.6 * (1 - t);
    }
  });
  return (
    <group position={[fl.origin[0], 0.7, fl.origin[2]]} rotation={[0, ang, 0]}>
      <mesh ref={ref} position={[0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1, 3.5, 12]} />
        <meshBasicMaterial color="#ff7a2a" transparent opacity={0.6} />
      </mesh>
      <pointLight position={[0, 0.4, 1.5]} color="#ff8a3a" intensity={5} distance={6} />
    </group>
  );
}
