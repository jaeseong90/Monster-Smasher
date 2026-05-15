"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGame } from "../store";

const PALETTES = [
  { name: "거실", bg: "#1a0830", fog: "#2a1244", a: "#ff5cc1", b: "#39f0ff" },
  { name: "옥상", bg: "#1d3262", fog: "#2b4a82", a: "#ffd76a", b: "#8effe8" },
  { name: "지하던전", bg: "#0c1a16", fog: "#163b30", a: "#5cff8e", b: "#ffae3c" },
  { name: "우주역", bg: "#040c20", fog: "#0d1d3a", a: "#7e7eff", b: "#ff5e5e" },
  { name: "시댁", bg: "#260b1a", fog: "#3c1530", a: "#ff7eb6", b: "#ffeb5c" },
  { name: "균열의 끝", bg: "#170628", fog: "#2e0c4a", a: "#ff4d8b", b: "#39f0ff" },
];

export function Skybox() {
  const wave = useGame((s) => s.wave);
  const idx = Math.min(PALETTES.length - 1, Math.floor((wave - 1) / 2));
  const pal = PALETTES[idx];
  const { scene } = useThree();

  useMemo(() => {
    scene.background = new THREE.Color(pal.bg);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color = new THREE.Color(pal.fog);
    }
  }, [pal, scene]);

  return (
    <group>
      <Particles color={pal.a} count={40} radius={20} y={6} />
      <Particles color={pal.b} count={30} radius={22} y={9} />
      <BiomeLabel name={pal.name} key={pal.name} />
    </group>
  );
}

function Particles({ color, count, radius, y }: { color: string; count: number; radius: number; y: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const positions = useMemo(() => {
    const arr: { x: number; y: number; z: number; phase: number }[] = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = radius * (0.4 + Math.random() * 0.6);
      arr.push({
        x: Math.cos(a) * r,
        y: y + Math.random() * 3 - 1.5,
        z: Math.sin(a) * r,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count, radius, y]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    const t = performance.now() * 0.001;
    positions.forEach((p, i) => {
      const yp = p.y + Math.sin(t + p.phase) * 0.5;
      m.makeTranslation(p.x, yp, p.z);
      ref.current!.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </instancedMesh>
  );
}

function BiomeLabel({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Pure HTML overlay via portal would need more setup; rely on HUD instead.
  return null;
}
