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
          <cylinderGeometry args={[ARENA_R, ARENA_R + 0.4, 1, 64]} />
          <meshStandardMaterial color="#1a0c28" roughness={0.55} metalness={0.35} />
        </mesh>
      </RigidBody>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[ARENA_R - 0.1, 96]} />
        <meshStandardMaterial
          color="#2a1148"
          roughness={0.45}
          metalness={0.55}
          map={ringTex}
          emissive="#3a1466"
          emissiveIntensity={0.18}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[ARENA_R - 0.6, ARENA_R - 0.2, 96]} />
        <meshBasicMaterial color="#ff5cc1" transparent opacity={0.55} toneMapped={false} />
      </mesh>

      <Walls radius={ARENA_R} />
      <FloorMarkings radius={ARENA_R} />
    </group>
  );
}

function Walls({ radius }: { radius: number }) {
  const segments = 32;
  const items: JSX.Element[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    const rot = a + Math.PI / 2;
    const accent = i % 4 === 0;
    items.push(
      <RigidBody key={i} type="fixed" colliders="cuboid" position={[x, 0.85, z]} rotation={[0, rot, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[(2 * Math.PI * radius) / segments + 0.4, 1.7, 0.42]} />
          <meshStandardMaterial
            color="#2a1048"
            emissive={accent ? "#ff4dbe" : "#5c2a90"}
            emissiveIntensity={accent ? 1.1 : 0.25}
            roughness={0.35}
            metalness={0.55}
            toneMapped={!accent}
          />
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
            <ringGeometry args={[1.2, 1.5, 32]} />
            <meshBasicMaterial color="#ff9ce9" transparent opacity={0.55} toneMapped={false} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.3, 64]} />
        <meshBasicMaterial color="#39f0ff" transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.35, 2.42, 64]} />
        <meshBasicMaterial color="#7ff8ff" transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  );
}

function makeRingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createRadialGradient(512, 512, 40, 512, 512, 512);
  grad.addColorStop(0, "#3a1466");
  grad.addColorStop(0.55, "#241048");
  grad.addColorStop(1, "#0e0420");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = "rgba(255,140,230,0.10)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 24; i++) {
    const r = 40 + i * 22;
    ctx.beginPath();
    ctx.arc(512, 512, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(120,240,255,0.07)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(512, 512);
    ctx.lineTo(512 + Math.cos(a) * 512, 512 + Math.sin(a) * 512);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,80,200,0.6)";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.2;
    const r = 280;
    const x = 512 + Math.cos(a) * r;
    const y = 512 + Math.sin(a) * r;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export const ARENA_RADIUS = ARENA_R;
