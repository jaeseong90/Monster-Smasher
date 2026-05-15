"use client";

import { forwardRef } from "react";
import * as THREE from "three";

interface Props {
  role: "husband" | "wife";
  hitFlash?: number;
  weaponEmoji?: string;
  armSwing?: number;
  legSwing?: number;
}

export const CharacterModel = forwardRef<THREE.Group, Props>(function CharacterModel(
  { role, hitFlash = 0, weaponEmoji, armSwing = 0, legSwing = 0 },
  ref
) {
  const skin = role === "husband" ? "#f2c896" : "#ffd6c4";
  const outfit = role === "husband" ? "#2a6cff" : "#ff4d8b";
  const outfitDark = role === "husband" ? "#0e2a78" : "#7a1846";
  const accent = role === "husband" ? "#ffd84d" : "#ffe066";

  return (
    <group ref={ref}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <capsuleGeometry args={[0.42, 0.5, 8, 18]} />
        <meshStandardMaterial
          color={outfit}
          roughness={0.42}
          metalness={0.25}
          emissive={outfitDark}
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh castShadow position={[0, 0.18, 0]}>
        <torusGeometry args={[0.44, 0.05, 8, 28]} />
        <meshStandardMaterial color="#0a0414" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0.32, 0.34]}>
        <boxGeometry args={[0.5, 0.18, 0.1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      <mesh castShadow position={[0, 1.18, 0]}>
        <sphereGeometry args={[0.36, 24, 24]} />
        <meshStandardMaterial color={skin} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[-0.13, 1.22, 0.32]}>
        <sphereGeometry args={[0.07, 14, 14]} />
        <meshStandardMaterial color="#0c0518" roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh position={[-0.13, 1.24, 0.36]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0.13, 1.22, 0.32]}>
        <sphereGeometry args={[0.07, 14, 14]} />
        <meshStandardMaterial color="#0c0518" roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh position={[0.13, 1.24, 0.36]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.10, 0.34]}>
        <boxGeometry args={[0.14, 0.04, 0.02]} />
        <meshStandardMaterial color="#7c2f2f" emissive="#3a1010" emissiveIntensity={0.3} />
      </mesh>
      {role === "wife" && (
        <>
          <mesh castShadow position={[0, 1.46, 0]}>
            <coneGeometry args={[0.18, 0.26, 16]} />
            <meshStandardMaterial
              color={outfit}
              emissive={outfit}
              emissiveIntensity={0.5}
              roughness={0.35}
              metalness={0.3}
            />
          </mesh>
          <mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color={accent} toneMapped={false} />
          </mesh>
        </>
      )}
      {role === "husband" && (
        <mesh castShadow position={[0, 1.48, -0.04]} rotation={[0.15, 0, 0]}>
          <torusGeometry args={[0.36, 0.08, 10, 28, Math.PI]} />
          <meshStandardMaterial color="#241008" roughness={0.6} metalness={0.2} />
        </mesh>
      )}
      <mesh castShadow position={[-0.4, 0.6, armSwing * 0.18]}>
        <sphereGeometry args={[0.17, 14, 14]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh castShadow position={[0.4, 0.6, -armSwing * 0.18]}>
        <sphereGeometry args={[0.17, 14, 14]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh castShadow position={[-0.18, -0.08, -legSwing * 0.14]}>
        <capsuleGeometry args={[0.17, 0.22, 6, 14]} />
        <meshStandardMaterial color="#120822" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh castShadow position={[0.18, -0.08, legSwing * 0.14]}>
        <capsuleGeometry args={[0.17, 0.22, 6, 14]} />
        <meshStandardMaterial color="#120822" roughness={0.45} metalness={0.35} />
      </mesh>
      {hitFlash > 0 && (
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.95, 18, 18]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={Math.min(0.7, hitFlash)} toneMapped={false} />
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
