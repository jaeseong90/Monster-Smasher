"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGame } from "../store";

const PALETTES = [
  { name: "거실", bg: "#1a0830", fog: "#2a1244", a: "#ff5cc1", b: "#39f0ff", accent: "#ffd76a" },
  { name: "옥상", bg: "#1d3262", fog: "#2b4a82", a: "#ffd76a", b: "#8effe8", accent: "#ff7eb6" },
  { name: "지하던전", bg: "#0c1a16", fog: "#163b30", a: "#5cff8e", b: "#ffae3c", accent: "#39f0ff" },
  { name: "우주역", bg: "#040c20", fog: "#0d1d3a", a: "#7e7eff", b: "#ff5e5e", accent: "#39f0ff" },
  { name: "시댁", bg: "#260b1a", fog: "#3c1530", a: "#ff7eb6", b: "#ffeb5c", accent: "#ff4d8b" },
  { name: "균열의 끝", bg: "#170628", fog: "#2e0c4a", a: "#ff4d8b", b: "#39f0ff", accent: "#ffd76a" },
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
      <Pillars accent={pal.a} accentB={pal.accent} />
      <Monoliths color={pal.b} />
      <FarRing color={pal.a} />
      <Dome color={pal.a} secondary={pal.b} />
      <Particles color={pal.a} count={80} radius={20} y={6} size={0.09} />
      <Particles color={pal.b} count={50} radius={24} y={11} size={0.12} />
      <Particles color={pal.accent} count={30} radius={28} y={15} size={0.14} />
      <CrackedSky color={pal.accent} />
    </group>
  );
}

function Pillars({ accent, accentB }: { accent: string; accentB: string }) {
  const count = 12;
  const items = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 21;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const tall = 4 + (i % 3) * 1.5;
    const col = i % 2 === 0 ? accent : accentB;
    items.push(
      <group key={i} position={[x, 0, z]} rotation={[0, -a, 0]}>
        <mesh position={[0, tall / 2, 0]}>
          <boxGeometry args={[0.6, tall, 0.6]} />
          <meshStandardMaterial color="#1c0a30" roughness={0.55} metalness={0.4} />
        </mesh>
        <mesh position={[0, tall - 0.2, 0.32]}>
          <boxGeometry args={[0.4, 0.6, 0.06]} />
          <meshBasicMaterial color={col} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.8, 0.32]}>
          <boxGeometry args={[0.4, 0.2, 0.06]} />
          <meshBasicMaterial color={col} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </group>
    );
  }
  return <group>{items}</group>;
}

function Monoliths({ color }: { color: string }) {
  const items = [];
  const positions: [number, number][] = [
    [0, -28],
    [-26, -10],
    [26, -10],
    [-22, 18],
    [22, 18],
  ];
  for (let i = 0; i < positions.length; i++) {
    const [x, z] = positions[i];
    const h = 6 + (i % 3) * 2;
    items.push(
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[2.2, h, 2.2]} />
          <meshStandardMaterial color="#100620" roughness={0.6} metalness={0.5} />
        </mesh>
        <mesh position={[0, h - 0.5, 1.11]}>
          <planeGeometry args={[1.6, 2.6]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} toneMapped={false} />
        </mesh>
      </group>
    );
  }
  return <group>{items}</group>;
}

function FarRing({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.04;
  });
  return (
    <group ref={ref} position={[0, 14, -32]} rotation={[0.4, 0, 0.1]}>
      <mesh>
        <torusGeometry args={[10, 0.08, 8, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[10, 0.04, 8, 96]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.45} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Dome({ color, secondary }: { color: string; secondary: string }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[34, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={color}
          side={THREE.BackSide}
          transparent
          opacity={0.08}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[33.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshBasicMaterial
          color={secondary}
          side={THREE.BackSide}
          transparent
          opacity={0.05}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CrackedSky({ color }: { color: string }) {
  const refs = useMemo(() => {
    const arr: { pos: [number, number, number]; rot: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      arr.push({
        pos: [Math.cos(a) * 22, 18 + Math.sin(i) * 3, Math.sin(a) * 22],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: 0.8 + Math.random() * 0.7,
      });
    }
    return arr;
  }, []);
  return (
    <group>
      {refs.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rot} scale={r.scale}>
          <planeGeometry args={[3, 0.18]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Particles({ color, count, radius, y, size }: { color: string; count: number; radius: number; y: number; size: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const positions = useMemo(() => {
    const arr: { x: number; y: number; z: number; phase: number; freq: number }[] = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = radius * (0.4 + Math.random() * 0.6);
      arr.push({
        x: Math.cos(a) * r,
        y: y + Math.random() * 4 - 2,
        z: Math.sin(a) * r,
        phase: Math.random() * Math.PI * 2,
        freq: 0.5 + Math.random() * 1.0,
      });
    }
    return arr;
  }, [count, radius, y]);

  useFrame(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    const t = performance.now() * 0.001;
    positions.forEach((p, i) => {
      const yp = p.y + Math.sin(t * p.freq + p.phase) * 0.8;
      const xp = p.x + Math.cos(t * p.freq * 0.3 + p.phase) * 0.4;
      m.makeTranslation(xp, yp, p.z);
      ref.current!.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.75} toneMapped={false} />
    </instancedMesh>
  );
}
