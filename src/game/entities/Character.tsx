"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";

interface Props {
  role: "husband" | "wife";
  hitFlash?: number;
  weaponEmoji?: string;
}

export const CharacterModel = forwardRef<THREE.Group, Props>(function CharacterModel(
  { role, hitFlash = 0, weaponEmoji },
  ref
) {
  const skin = role === "husband" ? "#f2c896" : "#ffd6c4";
  const outfit = role === "husband" ? "#2a6cff" : "#ff4d8b";
  const accent = role === "husband" ? "#ffd84d" : "#ffe066";

  return (
    <group ref={ref}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <capsuleGeometry args={[0.42, 0.5, 6, 14]} />
        <meshStandardMaterial color={outfit} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 0.32, 0.34]}>
        <boxGeometry args={[0.5, 0.18, 0.1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
      </mesh>
      <mesh castShadow position={[0, 1.18, 0]}>
        <sphereGeometry args={[0.36, 18, 18]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>
      <mesh position={[-0.13, 1.22, 0.32]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshBasicMaterial color="#1a1024" />
      </mesh>
      <mesh position={[0.13, 1.22, 0.32]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshBasicMaterial color="#1a1024" />
      </mesh>
      <mesh position={[0, 1.10, 0.34]}>
        <boxGeometry args={[0.12, 0.04, 0.02]} />
        <meshBasicMaterial color="#7c2f2f" />
      </mesh>
      {role === "wife" && (
        <>
          <mesh castShadow position={[0, 1.42, 0]}>
            <coneGeometry args={[0.16, 0.22, 12]} />
            <meshStandardMaterial color={outfit} />
          </mesh>
        </>
      )}
      {role === "husband" && (
        <mesh castShadow position={[0, 1.48, -0.04]} rotation={[0.15, 0, 0]}>
          <torusGeometry args={[0.36, 0.06, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#332014" />
        </mesh>
      )}
      <mesh castShadow position={[-0.4, 0.6, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh castShadow position={[0.4, 0.6, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh castShadow position={[-0.18, -0.08, 0]}>
        <capsuleGeometry args={[0.16, 0.2, 4, 10]} />
        <meshStandardMaterial color="#1a1024" />
      </mesh>
      <mesh castShadow position={[0.18, -0.08, 0]}>
        <capsuleGeometry args={[0.16, 0.2, 4, 10]} />
        <meshStandardMaterial color="#1a1024" />
      </mesh>
      {hitFlash > 0 && (
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.95, 14, 14]} />
          <meshBasicMaterial color="#fff" transparent opacity={Math.min(0.55, hitFlash)} />
        </mesh>
      )}
    </group>
  );
});

interface ShadowProps {
  size?: number;
}
export function GroundShadow({ size = 0.7 }: ShadowProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <circleGeometry args={[size, 16]} />
      <meshBasicMaterial color="#000" transparent opacity={0.35} />
    </mesh>
  );
}
