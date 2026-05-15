"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { CharacterModel, GroundShadow } from "./Character";
import type { RemotePlayer } from "../net";

export function RemotePlayerView({ state }: { state: RemotePlayer }) {
  const ref = useRef<THREE.Group>(null!);
  const target = useRef(new THREE.Vector3(state.x, 0, state.z));

  useFrame((_, dt) => {
    if (!ref.current) return;
    target.current.set(state.x, 0, state.z);
    ref.current.position.lerp(target.current, Math.min(1, dt * 12));
    ref.current.rotation.y += (state.rot - ref.current.rotation.y) * Math.min(1, dt * 12);
  });

  return (
    <group ref={ref} position={[state.x, 0, state.z]}>
      <CharacterModel role={state.role} />
      <GroundShadow size={0.7} />
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#6affb6" />
      </mesh>
    </group>
  );
}
