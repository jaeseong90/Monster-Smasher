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
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y = performance.now() * 0.003;
    ref.current.position.y = 0.6 + Math.sin(performance.now() * 0.004) * 0.15;
  });
  const color = drop.type === "heart" ? "#ff4a82" : drop.type === "star" ? "#ffd54a" : "#7eff8e";
  return (
    <group position={[drop.x, 0.6, drop.z]}>
      <group ref={ref}>
        <mesh castShadow>
          {drop.type === "star" ? (
            <icosahedronGeometry args={[0.3, 0]} />
          ) : drop.type === "heart" ? (
            <sphereGeometry args={[0.25, 12, 10]} />
          ) : (
            <boxGeometry args={[0.4, 0.4, 0.4]} />
          )}
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.3} />
        </mesh>
        <pointLight color={color} intensity={4} distance={3} />
      </group>
    </group>
  );
}
