"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Arena } from "./world/Arena";
import { Skybox } from "./world/Skybox";
import { LocalPlayer } from "./entities/LocalPlayer";
import { RemotePlayerView } from "./entities/RemotePlayer";
import { MonsterManager } from "./entities/MonsterManager";
import { Drops } from "./entities/Drops";
import { Hazards } from "./world/Hazards";
import { useGame } from "./store";
import { useNet } from "./net";
import { useShake } from "./camera";

export function Scene() {
  const status = useGame((s) => s.status);
  const decayCombo = useGame((s) => s.decayCombo);
  const pruneFloaters = useGame((s) => s.pruneFloaters);
  const playerRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const { camera } = useThree();
  const lookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const remote = useNet((s) => s.remote);
  const enabled = useNet((s) => s.enabled);

  useEffect(() => {
    camera.position.set(0, 14, 14);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((_, dt) => {
    if (status === "playing") {
      decayCombo(dt);
      pruneFloaters();
    }
    const target = playerRef.current;
    let cx = target.x;
    let cz = target.z;
    let close = false;
    if (enabled && remote) {
      cx = (target.x + remote.x) / 2;
      cz = (target.z + remote.z) / 2;
      const d = Math.hypot(target.x - remote.x, target.z - remote.z);
      close = d < 4;
    }
    useGame.getState().setPartnerBonus(close);
    const desired = new THREE.Vector3(cx, 14, cz + 11);
    camera.position.lerp(desired, Math.min(1, dt * 3));
    const shake = useShake.getState().consume(dt);
    if (shake > 0) {
      camera.position.x += (Math.random() - 0.5) * shake * 0.6;
      camera.position.y += (Math.random() - 0.5) * shake * 0.4;
      camera.position.z += (Math.random() - 0.5) * shake * 0.6;
    }
    lookAt.set(cx, 0.5, cz);
    camera.lookAt(lookAt);
  });

  return (
    <group>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#b29afc", "#180624", 0.6]} />
      <directionalLight
        castShadow
        position={[10, 18, 6]}
        intensity={1.6}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        color="#fff5d8"
      />
      <pointLight position={[-8, 5, -6]} intensity={20} color="#ff5cc1" distance={20} />
      <pointLight position={[8, 5, 8]} intensity={18} color="#39f0ff" distance={20} />

      <Skybox />
      <Arena />
      <Hazards />
      <MonsterManager playerRef={playerRef} />
      <Drops playerRef={playerRef} />
      <LocalPlayer positionRef={playerRef} />
      {enabled && remote && <RemotePlayerView state={remote} />}
    </group>
  );
}
