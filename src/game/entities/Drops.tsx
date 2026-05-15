"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGame, type DropItem } from "../store";
import { useNet } from "../net";
import { ding } from "../sounds";

interface Props {
  playerRef: React.MutableRefObject<THREE.Vector3>;
}

export function Drops({ playerRef }: Props) {
  const drops = useGame((s) => s.drops);
  const collectDrop = useGame((s) => s.collectDrop);
  const pruneDrops = useGame((s) => s.pruneDrops);
  const myRole = useNet((s) => s.myRole);

  useFrame(() => {
    pruneDrops();
    const p = playerRef.current;
    for (const d of drops) {
      const dist = Math.hypot(p.x - d.x, p.z - d.z);
      if (dist < 0.85) {
        if (d.type === "heart") {
          if (myRole === "husband") useGame.getState().healHusband(30);
          else useGame.getState().healWife(30);
        } else if (d.type === "star") {
          useGame.getState().addScore(50);
        } else if (d.type === "ammo") {
          useGame.getState().addScore(20);
        }
        useGame.getState().pushFloater({
          text: d.type === "heart" ? "+30 HP" : d.type === "star" ? "+50" : "+20",
          pos: [d.x, 1.4, d.z],
          color: d.type === "heart" ? "#ff6a8a" : "#ffeb5c",
        });
        ding();
        collectDrop(d.id);
      }
    }
  });

  return (
    <group>
      {drops.map((d) => (
        <DropMesh key={d.id} drop={d} />
      ))}
    </group>
  );
}

function DropMesh({ drop }: { drop: DropItem }) {
  const ref = useRef<THREE.Group>(null!);
  const haloRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.rotation.y = t * 2;
    ref.current.position.y = Math.sin(t * 3.2) * 0.12;
    if (haloRef.current) {
      const s = 1 + Math.sin(t * 4) * 0.12;
      haloRef.current.scale.setScalar(s);
    }
  });
  const color = drop.type === "heart" ? "#ff4a82" : drop.type === "star" ? "#ffd54a" : "#7eff8e";

  return (
    <group position={[drop.x, 0.65, drop.z]}>
      <group ref={ref}>
        {drop.type === "heart" ? <HeartShape color={color} /> : drop.type === "star" ? <GemShape color={color} /> : <AmmoCrate color={color} />}
        <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
        </mesh>
      </group>
      <pointLight color={color} intensity={3.5} distance={3} />
    </group>
  );
}

function HeartShape({ color }: { color: string }) {
  return (
    <group rotation={[Math.PI, 0, 0]}>
      <mesh castShadow position={[-0.13, 0.04, 0]}>
        <sphereGeometry args={[0.16, 18, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} roughness={0.3} metalness={0.2} toneMapped={false} />
      </mesh>
      <mesh castShadow position={[0.13, 0.04, 0]}>
        <sphereGeometry args={[0.16, 18, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} roughness={0.3} metalness={0.2} toneMapped={false} />
      </mesh>
      <mesh castShadow position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.26, 0.26, 0.26]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} roughness={0.3} metalness={0.2} toneMapped={false} />
      </mesh>
      <mesh position={[-0.06, 0.1, 0.15]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function GemShape({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.12, 0]}>
        <coneGeometry args={[0.24, 0.28, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} metalness={0.55} roughness={0.18} toneMapped={false} />
      </mesh>
      <mesh castShadow position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.24, 0.34, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} metalness={0.55} roughness={0.18} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <torusGeometry args={[0.24, 0.018, 6, 6]} />
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function AmmoCrate({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.32, 0.4]} />
        <meshStandardMaterial color="#2a2a32" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0.21]}>
        <boxGeometry args={[0.3, 0.16, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.42, 0.03, 0.42]} />
        <meshStandardMaterial color="#1a1a22" metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[0.21, 0.0, 0]}>
        <boxGeometry args={[0.02, 0.32, 0.42]} />
        <meshStandardMaterial color="#3a3a48" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.21, 0.0, 0]}>
        <boxGeometry args={[0.02, 0.32, 0.42]} />
        <meshStandardMaterial color="#3a3a48" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
