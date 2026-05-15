"use client";

import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";

const ARENA_R = 16;

export function Arena() {
  const ringTex = useMemo(() => makeRingTexture(), []);

  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid" friction={0.9}>
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <cylinderGeometry args={[ARENA_R, ARENA_R, 1, 48]} />
          <meshStandardMaterial color="#2a1640" roughness={0.85} />
        </mesh>
      </RigidBody>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[ARENA_R - 0.1, 64]} />
        <meshStandardMaterial color="#3a1e58" roughness={0.7} map={ringTex} />
      </mesh>

      <Walls radius={ARENA_R} />
      <FloorMarkings radius={ARENA_R} />
    </group>
  );
}

function Walls({ radius }: { radius: number }) {
  const segments = 24;
  const items: JSX.Element[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    const rot = a + Math.PI / 2;
    items.push(
      <RigidBody key={i} type="fixed" colliders="cuboid" position={[x, 0.8, z]} rotation={[0, rot, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[(2 * Math.PI * radius) / segments + 0.4, 1.6, 0.4]} />
          <meshStandardMaterial color="#3c1c64" emissive="#5c2a90" emissiveIntensity={0.35} roughness={0.7} />
        </mesh>
      </RigidBody>
    );
  }
  return <group>{items}</group>;
}

function FloorMarkings({ radius }: { radius: number }) {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * (radius - 2), 0.04, Math.sin(a) * (radius - 2)]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[1.2, 1.5, 24]} />
            <meshBasicMaterial color="#ff9ce9" transparent opacity={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.3, 48]} />
        <meshBasicMaterial color="#39f0ff" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function makeRingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#3a1e58";
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    const r = 30 + i * 16;
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.lineTo(256 + Math.cos(a) * 256, 256 + Math.sin(a) * 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export const ARENA_RADIUS = ARENA_R;
