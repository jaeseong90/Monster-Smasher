"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Environment, ContactShadows } from "@react-three/drei";
import { Arena } from "./world/Arena";
import { Skybox } from "./world/Skybox";
import { LocalPlayer } from "./entities/LocalPlayer";
import { RemotePlayerView } from "./entities/RemotePlayer";
import { MonsterManager } from "./entities/MonsterManager";
import { Drops } from "./entities/Drops";
import { ChoreChest } from "./entities/ChoreChest";
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
      <Environment preset="night" environmentIntensity={0.35} />
      <ambientLight intensity={0.2} />
      <hemisphereLight args={["#9b88ff", "#120420", 0.45]} />
      <directionalLight
        castShadow
        position={[12, 22, 8]}
        intensity={2.2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        color="#fff0d0"
      />
      <pointLight position={[-10, 4, -8]} intensity={28} color="#ff4dbe" distance={22} decay={2} />
      <pointLight position={[10, 4, 10]} intensity={26} color="#39f0ff" distance={22} decay={2} />
      <pointLight position={[0, 12, -14]} intensity={18} color="#ffd76a" distance={26} decay={2} />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.55}
        scale={42}
        blur={2.4}
        far={6}
        resolution={1024}
        color="#0a0214"
      />

      <Skybox />
      <Arena />
      <Hazards />
      <MonsterManager playerRef={playerRef} />
      <Drops playerRef={playerRef} />
      <ChoreChest playerRef={playerRef} />
      <LocalPlayer positionRef={playerRef} />
      {enabled && remote && <RemotePlayerView state={remote} />}
    </group>
  );
}
