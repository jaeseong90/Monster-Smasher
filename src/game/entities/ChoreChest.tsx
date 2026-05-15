"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGame } from "../store";
import { useNet } from "../net";
import { ding } from "../sounds";

interface Props {
  playerRef: React.MutableRefObject<THREE.Vector3>;
}

export function ChoreChest({ playerRef }: Props) {
  const status = useGame((s) => s.status);
  const endChorePvp = useGame((s) => s.endChorePvp);
  const myRole = useNet((s) => s.myRole);
  const ref = useRef<THREE.Group>(null);
  const grabbed = useRef(false);

  useEffect(() => {
    if (status === "chore-pvp") grabbed.current = false;
  }, [status]);

  useFrame(() => {
    if (status !== "chore-pvp" || grabbed.current) return;
    if (!ref.current) return;
    ref.current.rotation.y = performance.now() * 0.002;
    ref.current.position.y = 0.9 + Math.sin(performance.now() * 0.004) * 0.15;
    const p = playerRef.current;
    const d = Math.hypot(p.x, p.z);
    if (d < 1.1) {
      grabbed.current = true;
      ding();
      endChorePvp(myRole);
    }
  });

  if (status !== "chore-pvp") return null;

  return (
    <group position={[0, 0.9, 0]}>
      <group ref={ref}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.7, 0.7]} />
          <meshStandardMaterial color="#ffce3a" metalness={0.65} roughness={0.25} emissive="#ffaa00" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.95, 0.18, 0.75]} />
          <meshStandardMaterial color="#ffd86a" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.05, 0.4]}>
          <boxGeometry args={[0.2, 0.2, 0.05]} />
          <meshStandardMaterial color="#8a5a18" />
        </mesh>
        <pointLight color="#ffd76a" intensity={8} distance={6} />
      </group>
      <mesh position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.7, 32]} />
        <meshBasicMaterial color="#ffd76a" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
