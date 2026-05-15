"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { CharacterModel, GroundShadow } from "./Character";
import type { RemotePlayer } from "../net";

export function RemotePlayerView({ state }: { state: RemotePlayer }) {
  const ref = useRef<THREE.Group>(null!);
  const innerRef = useRef<THREE.Group>(null!);
  const target = useRef(new THREE.Vector3(state.x, 0, state.z));
  const last = useRef(new THREE.Vector3(state.x, 0, state.z));
  const moveT = useRef(0);

  useFrame((_, dt) => {
    if (!ref.current) return;
    target.current.set(state.x, 0, state.z);
    ref.current.position.lerp(target.current, Math.min(1, dt * 12));
    ref.current.rotation.y += (state.rot - ref.current.rotation.y) * Math.min(1, dt * 12);

    const speed = ref.current.position.distanceTo(last.current) / Math.max(0.0001, dt);
    last.current.copy(ref.current.position);
    const moveMag = Math.min(1, speed / 6);
    moveT.current += dt * (4 + moveMag * 10);
    if (innerRef.current) {
      const bobAmp = moveMag > 0.05 ? 0.08 : 0.02;
      innerRef.current.position.y = Math.abs(Math.sin(moveT.current)) * bobAmp;
      innerRef.current.rotation.x = moveMag * 0.18;
      const sq = moveMag > 0.05 ? 1 - Math.sin(moveT.current * 2) * 0.04 : 1;
      innerRef.current.scale.set(1, sq, 1);
    }
  });

  return (
    <group ref={ref} position={[state.x, 0, state.z]}>
      <GroundShadow size={0.7} />
      <group ref={innerRef}>
        <CharacterModel role={state.role} />
      </group>
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial color="#6affb6" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.1, 0]} intensity={4} color="#6affb6" distance={3} />
    </group>
  );
}
