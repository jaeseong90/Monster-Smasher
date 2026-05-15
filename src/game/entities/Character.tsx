"use client";

import { forwardRef, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type CharacterMotion = {
  armSwing: number;   // -1..1
  legSwing: number;   // -1..1
  bob: number;        // ~0..0.1
  lean: number;       // 0..0.3
  attackPose: number; // 0..1
};

export const DEFAULT_MOTION: CharacterMotion = {
  armSwing: 0,
  legSwing: 0,
  bob: 0,
  lean: 0,
  attackPose: 0,
};

interface Props {
  role: "husband" | "wife";
  hitFlash?: number;
  motion?: React.MutableRefObject<CharacterMotion>;
  weapon?: ReactNode;
}

export const CharacterModel = forwardRef<THREE.Group, Props>(function CharacterModel(
  { role, hitFlash = 0, motion, weapon },
  ref
) {
  const skin = role === "husband" ? "#f2c896" : "#ffd6c4";
  const outfit = role === "husband" ? "#2a6cff" : "#ff4d8b";
  const outfitDark = role === "husband" ? "#0e2a78" : "#7a1846";
  const accent = role === "husband" ? "#ffd84d" : "#ffe066";
  const armor = role === "husband" ? "#3a4a6a" : "#5a2a4a";
  const armorTrim = role === "husband" ? "#9bb6ff" : "#ff9ad8";

  const bodyRef = useRef<THREE.Group>(null!);
  const lArmRef = useRef<THREE.Group>(null!);
  const rArmRef = useRef<THREE.Group>(null!);
  const lLegRef = useRef<THREE.Group>(null!);
  const rLegRef = useRef<THREE.Group>(null!);
  const idleClock = useRef(Math.random() * Math.PI * 2);

  useFrame((_, dt) => {
    const m = motion?.current ?? DEFAULT_MOTION;
    idleClock.current += dt;
    const idleBreath = Math.sin(idleClock.current * 1.2) * 0.015;

    if (bodyRef.current) {
      bodyRef.current.position.y = m.bob;
      bodyRef.current.rotation.x = m.lean * 0.6 + m.attackPose * 0.45;
      const isIdle = Math.abs(m.armSwing) < 0.05 && m.attackPose < 0.05;
      bodyRef.current.scale.y = 1 + (isIdle ? idleBreath : 0);
    }
    if (lArmRef.current) {
      lArmRef.current.rotation.x = m.armSwing * 0.9 - m.attackPose * 1.3;
    }
    if (rArmRef.current) {
      rArmRef.current.rotation.x = -m.armSwing * 0.9 - m.attackPose * 1.7;
      rArmRef.current.rotation.z = -m.attackPose * 0.25;
    }
    if (lLegRef.current) {
      lLegRef.current.rotation.x = -m.legSwing * 0.65;
    }
    if (rLegRef.current) {
      rLegRef.current.rotation.x = m.legSwing * 0.65;
    }
  });

  return (
    <group ref={ref}>
      <group ref={bodyRef}>
        <mesh castShadow position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.4, 0.55, 8, 18]} />
          <meshStandardMaterial
            color={outfit}
            roughness={0.4}
            metalness={0.25}
            emissive={outfitDark}
            emissiveIntensity={0.22}
          />
        </mesh>

        <mesh castShadow position={[0, 0.3, 0]}>
          <torusGeometry args={[0.43, 0.05, 8, 32]} />
          <meshStandardMaterial color="#0a0414" roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 0.3, 0.42]}>
          <boxGeometry args={[0.18, 0.12, 0.05]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.1} toneMapped={false} />
        </mesh>

        <mesh castShadow position={[0, 0.78, 0.36]}>
          <boxGeometry args={[0.4, 0.42, 0.06]} />
          <meshStandardMaterial color={armor} roughness={0.32} metalness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 0.72, 0.39]}>
          <boxGeometry args={[0.22, 0.18, 0.04]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.0} toneMapped={false} />
        </mesh>
        <mesh castShadow position={[0, 0.92, 0.39]}>
          <boxGeometry args={[0.28, 0.025, 0.04]} />
          <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.85} toneMapped={false} />
        </mesh>
        <mesh castShadow position={[0, 0.6, 0.39]}>
          <boxGeometry args={[0.28, 0.025, 0.04]} />
          <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.85} toneMapped={false} />
        </mesh>

        <mesh castShadow position={[-0.42, 0.93, 0]} rotation={[0, 0, -0.25]}>
          <sphereGeometry args={[0.17, 18, 14]} />
          <meshStandardMaterial color={armor} roughness={0.32} metalness={0.7} />
        </mesh>
        <mesh castShadow position={[-0.42, 1.02, 0]} rotation={[0, 0, -0.25]}>
          <torusGeometry args={[0.16, 0.018, 6, 18, Math.PI]} />
          <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
        <mesh castShadow position={[0.42, 0.93, 0]} rotation={[0, 0, 0.25]}>
          <sphereGeometry args={[0.17, 18, 14]} />
          <meshStandardMaterial color={armor} roughness={0.32} metalness={0.7} />
        </mesh>
        <mesh castShadow position={[0.42, 1.02, 0]} rotation={[0, 0, 0.25]}>
          <torusGeometry args={[0.16, 0.018, 6, 18, Math.PI]} />
          <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.7} toneMapped={false} />
        </mesh>

        <mesh castShadow position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.13, 0.17, 0.16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>

        <mesh castShadow position={[0, 1.28, 0]}>
          <sphereGeometry args={[0.36, 28, 28]} />
          <meshStandardMaterial color={skin} roughness={0.55} metalness={0.04} />
        </mesh>

        <mesh position={[-0.13, 1.32, 0.31]}>
          <sphereGeometry args={[0.075, 18, 18]} />
          <meshStandardMaterial color="#0c0518" roughness={0.18} metalness={0.55} />
        </mesh>
        <mesh position={[-0.13, 1.34, 0.36]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[0.13, 1.32, 0.31]}>
          <sphereGeometry args={[0.075, 18, 18]} />
          <meshStandardMaterial color="#0c0518" roughness={0.18} metalness={0.55} />
        </mesh>
        <mesh position={[0.13, 1.34, 0.36]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        <mesh position={[-0.13, 1.45, 0.31]} rotation={[0, 0, role === "husband" ? -0.25 : 0.1]}>
          <boxGeometry args={[0.14, 0.04, 0.04]} />
          <meshStandardMaterial color="#1a0a1c" roughness={0.6} />
        </mesh>
        <mesh position={[0.13, 1.45, 0.31]} rotation={[0, 0, role === "husband" ? 0.25 : -0.1]}>
          <boxGeometry args={[0.14, 0.04, 0.04]} />
          <meshStandardMaterial color="#1a0a1c" roughness={0.6} />
        </mesh>

        <mesh position={[0, 1.15, 0.36]}>
          <boxGeometry args={[0.16, 0.04, 0.03]} />
          <meshStandardMaterial color="#7c2f2f" emissive="#3a1010" emissiveIntensity={0.35} />
        </mesh>

        {role === "wife" && (
          <>
            <mesh castShadow position={[0, 1.55, -0.18]} rotation={[0.55, 0, 0]}>
              <coneGeometry args={[0.34, 0.6, 24, 1, true]} />
              <meshStandardMaterial
                color={outfit}
                emissive={outfitDark}
                emissiveIntensity={0.35}
                roughness={0.5}
                metalness={0.15}
                side={2}
              />
            </mesh>
            <mesh castShadow position={[0, 1.58, -0.04]} rotation={[0.12, 0, 0]}>
              <coneGeometry args={[0.18, 0.32, 18]} />
              <meshStandardMaterial
                color={outfit}
                emissive={outfit}
                emissiveIntensity={0.65}
                roughness={0.32}
                metalness={0.4}
              />
            </mesh>
            <mesh castShadow position={[0, 1.48, 0]}>
              <torusGeometry args={[0.34, 0.024, 8, 32]} />
              <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.85} toneMapped={false} />
            </mesh>
            <mesh castShadow position={[0, 1.48, 0.34]}>
              <sphereGeometry args={[0.05, 14, 14]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
            <mesh position={[0, 1.78, -0.04]}>
              <sphereGeometry args={[0.06, 14, 14]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
            <pointLight position={[0, 1.78, -0.04]} color={accent} intensity={2.2} distance={1.6} />

            <mesh castShadow position={[0, 0.62, -0.46]}>
              <boxGeometry args={[0.36, 0.5, 0.16]} />
              <meshStandardMaterial color={armor} roughness={0.32} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.62, -0.55]}>
              <boxGeometry args={[0.22, 0.32, 0.04]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
            </mesh>
            <mesh position={[-0.13, 0.6, -0.55]}>
              <cylinderGeometry args={[0.04, 0.04, 0.32, 12]} />
              <meshStandardMaterial color="#2a2a32" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.13, 0.6, -0.55]}>
              <cylinderGeometry args={[0.04, 0.04, 0.32, 12]} />
              <meshStandardMaterial color="#2a2a32" metalness={0.7} roughness={0.3} />
            </mesh>
            <pointLight position={[0, 0.62, -0.6]} color={accent} intensity={3} distance={2.2} />
          </>
        )}
        {role === "husband" && (
          <>
            <mesh castShadow position={[0, 1.56, -0.05]} rotation={[0.18, 0, 0]}>
              <torusGeometry args={[0.4, 0.1, 14, 32, Math.PI]} />
              <meshStandardMaterial color="#1a0a06" roughness={0.7} metalness={0.18} />
            </mesh>
            <mesh castShadow position={[-0.22, 1.48, 0.1]} rotation={[0.4, 0, -0.3]}>
              <coneGeometry args={[0.08, 0.18, 5]} />
              <meshStandardMaterial color="#1a0a06" roughness={0.7} metalness={0.18} />
            </mesh>
            <mesh castShadow position={[0.22, 1.48, 0.1]} rotation={[0.4, 0, 0.3]}>
              <coneGeometry args={[0.08, 0.18, 5]} />
              <meshStandardMaterial color="#1a0a06" roughness={0.7} metalness={0.18} />
            </mesh>

            <mesh position={[-0.08, 1.13, 0.36]}>
              <boxGeometry args={[0.07, 0.04, 0.02]} />
              <meshStandardMaterial color="#1a0a06" roughness={0.6} />
            </mesh>
            <mesh position={[0.08, 1.13, 0.36]}>
              <boxGeometry args={[0.07, 0.04, 0.02]} />
              <meshStandardMaterial color="#1a0a06" roughness={0.6} />
            </mesh>
            <mesh position={[0, 1.08, 0.36]}>
              <boxGeometry args={[0.22, 0.05, 0.02]} />
              <meshStandardMaterial color="#1a0a06" roughness={0.6} />
            </mesh>

            <mesh castShadow position={[0, 0.55, -0.42]} rotation={[0.18, 0, 0]}>
              <planeGeometry args={[0.78, 1.05]} />
              <meshStandardMaterial
                color={outfit}
                emissive={outfitDark}
                emissiveIntensity={0.35}
                roughness={0.55}
                metalness={0.12}
                side={2}
              />
            </mesh>
            <mesh position={[0, 1.05, -0.42]}>
              <boxGeometry args={[0.78, 0.08, 0.05]} />
              <meshStandardMaterial color={armor} roughness={0.32} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.04, -0.32]} rotation={[0.18, 0, 0]}>
              <boxGeometry args={[0.78, 0.04, 0.03]} />
              <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.65} toneMapped={false} />
            </mesh>
          </>
        )}

        <group position={[-0.45, 0.92, 0]} ref={lArmRef}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.1, 0.24, 6, 14]} />
            <meshStandardMaterial
              color={outfit}
              roughness={0.42}
              metalness={0.25}
              emissive={outfitDark}
              emissiveIntensity={0.18}
            />
          </mesh>
          <mesh castShadow position={[0, -0.36, 0]}>
            <cylinderGeometry args={[0.12, 0.115, 0.16, 14]} />
            <meshStandardMaterial color={armor} roughness={0.32} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.36, 0.13]}>
            <boxGeometry args={[0.1, 0.025, 0.025]} />
            <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.85} toneMapped={false} />
          </mesh>
          <mesh castShadow position={[0, -0.46, 0]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
        </group>

        <group position={[0.45, 0.92, 0]} ref={rArmRef}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.1, 0.24, 6, 14]} />
            <meshStandardMaterial
              color={outfit}
              roughness={0.42}
              metalness={0.25}
              emissive={outfitDark}
              emissiveIntensity={0.18}
            />
          </mesh>
          <mesh castShadow position={[0, -0.36, 0]}>
            <cylinderGeometry args={[0.12, 0.115, 0.16, 14]} />
            <meshStandardMaterial color={armor} roughness={0.32} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.36, 0.13]}>
            <boxGeometry args={[0.1, 0.025, 0.025]} />
            <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.85} toneMapped={false} />
          </mesh>
          <mesh castShadow position={[0, -0.46, 0]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
          {weapon && <group position={[0, -0.5, 0.02]}>{weapon}</group>}
        </group>

        <group position={[-0.18, 0.08, 0]} ref={lLegRef}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.14, 0.26, 6, 14]} />
            <meshStandardMaterial color="#120822" roughness={0.45} metalness={0.35} />
          </mesh>
          <mesh castShadow position={[0, -0.38, 0.02]}>
            <cylinderGeometry args={[0.16, 0.15, 0.18, 14]} />
            <meshStandardMaterial color={armor} roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh castShadow position={[0, -0.45, 0.08]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.24, 0.1, 0.32]} />
            <meshStandardMaterial color="#0a0414" roughness={0.45} metalness={0.55} />
          </mesh>
          <mesh position={[0, -0.42, 0.22]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.22, 0.03, 0.04]} />
            <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.7} toneMapped={false} />
          </mesh>
        </group>

        <group position={[0.18, 0.08, 0]} ref={rLegRef}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.14, 0.26, 6, 14]} />
            <meshStandardMaterial color="#120822" roughness={0.45} metalness={0.35} />
          </mesh>
          <mesh castShadow position={[0, -0.38, 0.02]}>
            <cylinderGeometry args={[0.16, 0.15, 0.18, 14]} />
            <meshStandardMaterial color={armor} roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh castShadow position={[0, -0.45, 0.08]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.24, 0.1, 0.32]} />
            <meshStandardMaterial color="#0a0414" roughness={0.45} metalness={0.55} />
          </mesh>
          <mesh position={[0, -0.42, 0.22]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.22, 0.03, 0.04]} />
            <meshStandardMaterial color={armorTrim} emissive={armorTrim} emissiveIntensity={0.7} toneMapped={false} />
          </mesh>
        </group>

        {hitFlash > 0 && (
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[1.05, 18, 18]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={Math.min(0.7, hitFlash)} toneMapped={false} />
          </mesh>
        )}
      </group>
    </group>
  );
});

interface ShadowProps {
  size?: number;
}
export function GroundShadow({ size = 0.7 }: ShadowProps) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <circleGeometry args={[size, 24]} />
      <meshBasicMaterial color="#000" transparent opacity={0.4} />
    </mesh>
  );
}
