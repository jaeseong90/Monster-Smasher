"use client";

import { RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Hazards() {
  return (
    <group>
      <SawBlade position={[-7, 1.0, 4]} speed={6} />
      <SawBlade position={[7, 1.0, -4]} speed={-5} />
      <Spikes position={[0, 0.05, -9]} />
      <Spikes position={[-9, 0.05, 0]} />
      <Spikes position={[9, 0.05, 0]} />
    </group>
  );
}

function SawBlade({ position, speed }: { position: [number, number, number]; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += speed * dt;
  });
  return (
    <group position={position}>
      <mesh position={[0, -0.95, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 0.4, 14]} />
        <meshStandardMaterial color="#1a1422" roughness={0.55} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.18, 0.5, 14]} />
        <meshStandardMaterial color="#2a2230" roughness={0.4} metalness={0.55} />
      </mesh>
      <group ref={ref}>
        <RigidBody type="kinematicPosition" colliders="cuboid" sensor>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]} userData={{ tag: "hazard" }}>
            <cylinderGeometry args={[1.4, 1.4, 0.1, 24]} />
            <meshStandardMaterial color="#c8cdd8" metalness={0.9} roughness={0.16} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.42, 0.04, 8, 28]} />
            <meshBasicMaterial color="#ff5566" toneMapped={false} />
          </mesh>
          {Array.from({ length: 14 }).map((_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4]}
                rotation={[0, -a, 0]}
                castShadow
              >
                <coneGeometry args={[0.22, 0.58, 4]} />
                <meshStandardMaterial color="#eef0f5" metalness={0.92} roughness={0.12} />
              </mesh>
            );
          })}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.16, 14]} />
            <meshStandardMaterial color="#3a2a48" metalness={0.65} roughness={0.32} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  );
}

function Spikes({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" sensor position={position}>
      <group userData={{ tag: "hazard" }}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[2.5, 0.12, 1.3]} />
          <meshStandardMaterial color="#1a1428" roughness={0.55} metalness={0.45} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => {
          const x = (i - 2) * 0.5;
          return (
            <group key={i} position={[x, 0.1, 0]}>
              <mesh position={[0, 0.34, 0]} castShadow>
                <coneGeometry args={[0.16, 0.68, 8]} />
                <meshStandardMaterial color="#e8edf4" metalness={0.9} roughness={0.18} />
              </mesh>
              <mesh position={[0, 0.36, 0]}>
                <coneGeometry args={[0.18, 0.72, 8]} />
                <meshBasicMaterial color="#ff2a4a" transparent opacity={0.18} toneMapped={false} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 1.4]} />
          <meshBasicMaterial color="#ff2a4a" transparent opacity={0.18} toneMapped={false} />
        </mesh>
      </group>
    </RigidBody>
  );
}
