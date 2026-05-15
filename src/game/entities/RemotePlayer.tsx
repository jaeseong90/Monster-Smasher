"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { CharacterModel, GroundShadow, type CharacterMotion } from "./Character";
import { WeaponHeld } from "./LocalPlayer";
import { useNet, type RemotePlayer } from "../net";

const SEND_HZ = 15;
const INTERP_DELAY_MS = 1000 / SEND_HZ + 30;

export function RemotePlayerView({ state }: { state: RemotePlayer }) {
  const ref = useRef<THREE.Group>(null!);
  const motionRef = useRef<CharacterMotion>({
    armSwing: 0,
    legSwing: 0,
    bob: 0,
    lean: 0,
    attackPose: 0,
  });
  const moveT = useRef(0);
  const lastPos = useRef(new THREE.Vector3(state.x, 0, state.z));
  const smoothVel = useRef(0);
  const sinceAttack = useRef(99);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const snaps = useNet.getState().remoteSnaps;
    const renderAt = Date.now() - INTERP_DELAY_MS;

    let target: { x: number; z: number; rot: number } = { x: state.x, z: state.z, rot: state.rot };
    if (snaps.length >= 2) {
      let i = snaps.length - 1;
      while (i > 0 && snaps[i].t > renderAt) i--;
      const a = snaps[i];
      const b = snaps[i + 1] ?? a;
      const span = Math.max(1, b.t - a.t);
      const alpha = Math.min(1, Math.max(0, (renderAt - a.t) / span));
      const rotDiff = wrapAngle(b.rot - a.rot);
      target = {
        x: a.x + (b.x - a.x) * alpha,
        z: a.z + (b.z - a.z) * alpha,
        rot: a.rot + rotDiff * alpha,
      };
    } else if (snaps.length === 1) {
      target = snaps[0];
    }

    const k = Math.min(1, dt * 18);
    ref.current.position.x += (target.x - ref.current.position.x) * k;
    ref.current.position.z += (target.z - ref.current.position.z) * k;
    const curRot = ref.current.rotation.y;
    const rotDelta = wrapAngle(target.rot - curRot);
    ref.current.rotation.y = curRot + rotDelta * k;

    const newPos = ref.current.position;
    const instSpeed = Math.hypot(newPos.x - lastPos.current.x, newPos.z - lastPos.current.z) / Math.max(0.0001, dt);
    lastPos.current.set(newPos.x, 0, newPos.z);
    smoothVel.current = smoothVel.current * 0.85 + instSpeed * 0.15;
    const moveMag = Math.min(1, smoothVel.current / 6);
    moveT.current += dt * (4 + moveMag * 8);

    sinceAttack.current += dt;
    const remoteAttackT = useNet.getState().lastRemoteAttackT;
    if (remoteAttackT > 0 && Date.now() - remoteAttackT < 250 && sinceAttack.current > 0.25) {
      sinceAttack.current = 0;
    }

    const m = motionRef.current;
    if (moveMag > 0.05) {
      m.armSwing = Math.sin(moveT.current) * moveMag;
      m.legSwing = m.armSwing;
      m.bob = Math.abs(Math.sin(moveT.current * 2)) * 0.06;
      m.lean = moveMag * 0.28;
    } else {
      m.armSwing *= 0.85;
      m.legSwing *= 0.85;
      m.bob *= 0.85;
      m.lean *= 0.85;
    }
    const lungeT = Math.max(0, 1 - sinceAttack.current / 0.25);
    m.attackPose = lungeT * lungeT;
  });

  return (
    <group ref={ref} position={[state.x, 0, state.z]}>
      <GroundShadow size={0.7} />
      <CharacterModel
        role={state.role}
        motion={motionRef}
        weapon={<WeaponHeld weapon={state.weapon} />}
      />
      <mesh position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <meshBasicMaterial color="#6affb6" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.15, 0]} intensity={4} color="#6affb6" distance={3} />
    </group>
  );
}

function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
