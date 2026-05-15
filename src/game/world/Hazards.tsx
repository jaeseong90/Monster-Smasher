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
      <group ref={ref}>
        <RigidBody type="kinematicPosition" colliders="cuboid" sensor>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]} userData={{ tag: "hazard" }}>
            <cylinderGeometry args={[1.4, 1.4, 0.1, 14]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.25} />
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
                <coneGeometry args={[0.25, 0.6, 4]} />
                <meshStandardMaterial color="#e8e8e8" metalness={0.9} roughness={0.2} />
              </mesh>
            );
          })}
        </RigidBody>
      </group>
    </group>
  );
}

function Spikes({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" sensor position={position}>
      <group userData={{ tag: "hazard" }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const x = (i - 2) * 0.4;
          return (
            <mesh key={i} position={[x, 0.3, 0]} castShadow>
              <coneGeometry args={[0.18, 0.6, 4]} />
              <meshStandardMaterial color="#ff5d76" emissive="#ff2a4a" emissiveIntensity={0.4} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 1.2]} />
          <meshBasicMaterial color="#ff2a4a" transparent opacity={0.18} />
        </mesh>
      </group>
    </RigidBody>
  );
}
