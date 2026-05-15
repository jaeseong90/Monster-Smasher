"use client";

import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CharacterModel, GroundShadow, type CharacterMotion } from "./Character";
import { useInput } from "../input";
import { HUSBAND_WEAPONS, WEAPONS, WIFE_WEAPONS, useGame } from "../store";
import { useNet } from "../net";
import { spawnSwing, spawnProjectile, spawnFlame } from "./Attacks";
import { useAttackBus } from "./AttackBus";
import { ARENA_RADIUS } from "../world/Arena";
import { thump, ding } from "../sounds";

interface Props {
  positionRef: React.MutableRefObject<THREE.Vector3>;
}

export function LocalPlayer({ positionRef }: Props) {
  const body = useRef<RapierRigidBody>(null!);
  const modelRef = useRef<THREE.Group>(null!);
  const facing = useRef(0);
  const lastAttack = useRef(0);
  const hitFlash = useRef(0);
  const moveT = useRef(0);
  const sinceAttack = useRef(99);
  const motionRef = useRef<CharacterMotion>({ armSwing: 0, legSwing: 0, bob: 0, lean: 0, attackPose: 0 });
  const myRole = useNet((s) => s.myRole);
  const enabled = useNet((s) => s.enabled);
  const broadcastSelf = useNet((s) => s.broadcastSelf);
  const broadcastAttack = useNet((s) => s.broadcastAttack);
  const weaponSlot = useInput((s) => s.weaponSlot);
  const consumeAttackEdge = useInput((s) => s.consumeAttackEdge);

  const husbandWeapon = useGame((s) => s.husbandWeapon);
  const wifeWeapon = useGame((s) => s.wifeWeapon);
  const setHusbandWeapon = useGame((s) => s.setHusbandWeapon);
  const setWifeWeapon = useGame((s) => s.setWifeWeapon);
  const status = useGame((s) => s.status);

  const myWeaponId = myRole === "husband" ? husbandWeapon : wifeWeapon;
  const setMyWeapon = myRole === "husband" ? setHusbandWeapon : setWifeWeapon;
  const myList = myRole === "husband" ? HUSBAND_WEAPONS : WIFE_WEAPONS;

  useEffect(() => {
    const w = myList[weaponSlot] ?? myList[0];
    setMyWeapon(w);
  }, [weaponSlot, myList, setMyWeapon]);

  const pushAttack = useAttackBus((s) => s.push);

  const lastBroadcast = useRef(0);

  useFrame((_, dt) => {
    if (!body.current) return;
    const input = useInput.getState();
    if (status !== "playing" && status !== "chore-pvp") return;

    const gs = useGame.getState();
    const iAmDown = myRole === "husband" ? gs.downH : gs.downW;
    if (iAmDown) {
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      const t = body.current.translation();
      positionRef.current.set(t.x, t.y, t.z);
      if (modelRef.current) {
        modelRef.current.position.set(t.x, 0.1, t.z);
        modelRef.current.rotation.set(Math.PI / 2, facing.current, 0);
      }
      const m = motionRef.current;
      m.armSwing = 0;
      m.legSwing = 0;
      m.bob = 0;
      m.lean = 0;
      m.attackPose = 0;
      if (enabled) {
        lastBroadcast.current += dt;
        if (lastBroadcast.current >= 0.066) {
          lastBroadcast.current = 0;
          broadcastSelf({ x: t.x, z: t.z, rot: facing.current, hp: 0, weapon: myWeaponId });
        }
      }
      return;
    }

    const speed = 6.5;
    const vel = body.current.linvel();
    const tx = input.move.x * speed;
    const tz = input.move.y * speed;
    body.current.setLinvel({ x: tx, y: vel.y, z: tz }, true);

    const t = body.current.translation();
    positionRef.current.set(t.x, t.y, t.z);
    const moveMag = Math.hypot(input.move.x, input.move.y);
    if (modelRef.current) {
      modelRef.current.position.set(t.x, t.y - 0.1, t.z);
      if (moveMag > 0.05) {
        facing.current = Math.atan2(input.move.x, input.move.y);
      }
      modelRef.current.rotation.y = facing.current;
    }
    sinceAttack.current += dt;
    if (moveMag > 0.05) {
      moveT.current += dt * (7 + moveMag * 4);
    } else {
      moveT.current += dt * 2;
    }
    const m = motionRef.current;
    if (moveMag > 0.05) {
      m.armSwing = Math.sin(moveT.current) * Math.min(1, moveMag * 1.3);
      m.legSwing = Math.sin(moveT.current) * Math.min(1, moveMag * 1.3);
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

    const r = Math.hypot(t.x, t.z);
    if (r > ARENA_RADIUS - 0.6) {
      const nx = t.x / r;
      const nz = t.z / r;
      body.current.setTranslation({ x: nx * (ARENA_RADIUS - 0.6), y: t.y, z: nz * (ARENA_RADIUS - 0.6) }, true);
    }

    if (hitFlash.current > 0) hitFlash.current = Math.max(0, hitFlash.current - dt * 3);

    const wDef = WEAPONS[myWeaponId];
    lastAttack.current += dt;
    const pressed = consumeAttackEdge() || input.attack;

    const partnerDown = myRole === "husband" ? gs.downW : gs.downH;
    if (partnerDown && enabled) {
      const rp = useNet.getState().remote;
      if (rp) {
        const d = Math.hypot(rp.x - t.x, rp.z - t.z);
        if (d < 1.6 && input.attack) {
          if (myRole === "husband") useGame.getState().cprWife(80 * dt);
          else useGame.getState().cprHusband(80 * dt);
          ding();
          return;
        }
      }
    }
    if (pressed && lastAttack.current >= wDef.cooldown) {
      lastAttack.current = 0;
      sinceAttack.current = 0;
      const ang = facing.current;
      const dx = Math.sin(ang);
      const dz = Math.cos(ang);
      if (wDef.ranged && wDef.id === "bazooka") {
        spawnProjectile({ origin: [t.x, 0.8, t.z], dir: [dx, dz], owner: "me", weapon: wDef.id });
        thump();
      } else if (wDef.ranged && wDef.id === "flamethrower") {
        spawnFlame({ origin: [t.x, 0.8, t.z], dir: [dx, dz], owner: "me" });
      } else {
        spawnSwing({ origin: [t.x, 0.8, t.z], dir: [dx, dz], owner: "me", weapon: wDef.id });
        thump();
      }
      pushAttack({
        from: "me",
        weapon: wDef.id,
        x: t.x,
        z: t.z,
        dirX: dx,
        dirZ: dz,
        t: performance.now(),
      });
      if (enabled) {
        broadcastAttack({
          from: useNet.getState().myId,
          weapon: wDef.id,
          x: t.x,
          z: t.z,
          dirX: dx,
          dirZ: dz,
          t: Date.now(),
        });
      }
    }

    if (enabled) {
      lastBroadcast.current += dt;
      if (lastBroadcast.current >= 0.066) {
        lastBroadcast.current = 0;
        const hpH = useGame.getState().hpH;
        const hpW = useGame.getState().hpW;
        broadcastSelf({
          x: t.x,
          z: t.z,
          rot: facing.current,
          hp: myRole === "husband" ? hpH : hpW,
          weapon: myWeaponId,
        });
      }
    }
  });

  useEffect(() => {
    const handler = (e: CustomEvent<{ amount: number }>) => {
      hitFlash.current = 1;
      if (myRole === "husband") useGame.getState().damageHusband(e.detail.amount);
      else useGame.getState().damageWife(e.detail.amount);
    };
    window.addEventListener("local-hit" as any, handler as any);

    const blast = (e: CustomEvent<{ x: number; z: number; radius: number; force: number; owner: "me" | "remote" }>) => {
      if (!body.current) return;
      const t = body.current.translation();
      const dx = t.x - e.detail.x;
      const dz = t.z - e.detail.z;
      const dist = Math.hypot(dx, dz);
      if (dist > e.detail.radius) return;
      const fall = 1 - dist / e.detail.radius;
      const nx = dx / Math.max(0.001, dist);
      const nz = dz / Math.max(0.001, dist);
      const force = e.detail.force * fall;
      body.current.applyImpulse({ x: nx * force * 2, y: 8 + force * 0.2, z: nz * force * 2 }, true);
      // 자기가 쏜 게 아니면 약간의 데미지 (자폭은 데미지 적게)
      if (e.detail.owner === "me") {
        if (myRole === "husband") useGame.getState().damageHusband(3);
        else useGame.getState().damageWife(3);
        useGame.getState().pushFloater({ text: "내가 쐈잖아 ㅋ", pos: [t.x, 1.5, t.z], color: "#ffe066" });
      } else {
        if (myRole === "husband") useGame.getState().damageHusband(6);
        else useGame.getState().damageWife(6);
        useGame.getState().pushFloater({ text: "여보 쏘지 마!", pos: [t.x, 1.5, t.z], color: "#ff5fa3" });
      }
      hitFlash.current = 1;
    };
    window.addEventListener("explosion-blast" as any, blast as any);

    return () => {
      window.removeEventListener("local-hit" as any, handler as any);
      window.removeEventListener("explosion-blast" as any, blast as any);
    };
  }, [myRole]);

  const start: [number, number, number] = useMemo(
    () => (myRole === "husband" ? [-3, 1, 0] : [3, 1, 0]),
    [myRole]
  );

  return (
    <>
      <RigidBody
        ref={body}
        colliders={false}
        position={start}
        type="dynamic"
        enabledRotations={[false, false, false]}
        linearDamping={6}
        mass={2}
        userData={{ tag: "player", role: myRole }}
      >
        <CapsuleCollider args={[0.35, 0.4]} />
      </RigidBody>
      <group ref={modelRef}>
        <GroundShadow size={0.7} />
        <CharacterModel
          role={myRole}
          hitFlash={hitFlash.current}
          motion={motionRef}
          weapon={<WeaponHeld weapon={myWeaponId} />}
        />
      </group>
    </>
  );
}

export function WeaponHeld({ weapon }: { weapon: string }) {
  switch (weapon) {
    case "hammer":
      return (
        <group rotation={[0.3, 0.2, -0.15]}>
          <mesh castShadow position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.7, 12]} />
            <meshStandardMaterial color="#3d2410" roughness={0.65} metalness={0.1} />
          </mesh>
          <mesh castShadow position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.08, 12]} />
            <meshStandardMaterial color="#0a0414" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.75, 0]}>
            <boxGeometry args={[0.34, 0.32, 0.62]} />
            <meshStandardMaterial color="#8c93a3" metalness={0.78} roughness={0.28} />
          </mesh>
          <mesh castShadow position={[0, 0.75, 0.32]}>
            <boxGeometry args={[0.36, 0.04, 0.02]} />
            <meshStandardMaterial color="#ffd84d" emissive="#ffb733" emissiveIntensity={0.9} toneMapped={false} />
          </mesh>
          <mesh castShadow position={[0, 0.75, -0.32]}>
            <boxGeometry args={[0.36, 0.04, 0.02]} />
            <meshStandardMaterial color="#ffd84d" emissive="#ffb733" emissiveIntensity={0.9} toneMapped={false} />
          </mesh>
        </group>
      );
    case "greatsword":
      return (
        <group rotation={[1.0, 0.2, 0]}>
          <mesh castShadow position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.22, 12]} />
            <meshStandardMaterial color="#3d2410" roughness={0.65} />
          </mesh>
          <mesh castShadow position={[0, 0.2, 0]}>
            <boxGeometry args={[0.36, 0.08, 0.08]} />
            <meshStandardMaterial color="#ffd84d" metalness={0.7} roughness={0.35} emissive="#7a4a00" emissiveIntensity={0.3} />
          </mesh>
          <mesh castShadow position={[0, 0.85, 0]}>
            <boxGeometry args={[0.12, 1.2, 0.04]} />
            <meshStandardMaterial color="#e8edf2" metalness={0.85} roughness={0.18} />
          </mesh>
          <mesh castShadow position={[0, 0.85, 0]}>
            <boxGeometry args={[0.04, 1.2, 0.06]} />
            <meshStandardMaterial color="#c9ecff" emissive="#39c6ff" emissiveIntensity={0.85} toneMapped={false} />
          </mesh>
          <mesh castShadow position={[0, 1.5, 0]}>
            <coneGeometry args={[0.06, 0.16, 4]} />
            <meshStandardMaterial color="#e8edf2" metalness={0.85} roughness={0.18} />
          </mesh>
        </group>
      );
    case "pan":
      return (
        <group rotation={[1.0, 0.2, 0]}>
          <mesh castShadow position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.16, 12]} />
            <meshStandardMaterial color="#2c1410" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0.32, 0]}>
            <boxGeometry args={[0.09, 0.5, 0.05]} />
            <meshStandardMaterial color="#3a1a1a" roughness={0.5} metalness={0.2} />
          </mesh>
          <mesh castShadow position={[0, 0.66, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.08, 24]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.55} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.71, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.005, 24]} />
            <meshStandardMaterial color="#3a2a1c" roughness={0.6} />
          </mesh>
        </group>
      );
    case "leek":
      return (
        <group rotation={[1.0, 0.3, 0]}>
          <mesh castShadow position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.55, 12]} />
            <meshStandardMaterial color="#f8f8f0" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0.58, 0]}>
            <cylinderGeometry args={[0.06, 0.04, 0.6, 12]} />
            <meshStandardMaterial color="#3fa54a" roughness={0.55} emissive="#1a4a1a" emissiveIntensity={0.18} />
          </mesh>
          <mesh castShadow position={[0.04, 0.82, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.04, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#5fbb5a" roughness={0.55} />
          </mesh>
          <mesh castShadow position={[-0.04, 0.82, 0]} rotation={[0, 0, -0.3]}>
            <cylinderGeometry args={[0.04, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#5fbb5a" roughness={0.55} />
          </mesh>
        </group>
      );
    case "bazooka":
      return (
        <group rotation={[Math.PI / 2 - 0.2, 0, 0]} position={[0, 0.12, 0.12]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.95, 18]} />
            <meshStandardMaterial color="#3a4a3a" metalness={0.55} roughness={0.45} />
          </mesh>
          <mesh castShadow position={[0, 0, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.16, 0.08, 18]} />
            <meshStandardMaterial color="#1f2a1f" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh castShadow position={[0, 0.12, -0.2]}>
            <boxGeometry args={[0.08, 0.18, 0.1]} />
            <meshStandardMaterial color="#241a14" roughness={0.5} />
          </mesh>
          <mesh castShadow position={[0, 0.22, 0.1]}>
            <boxGeometry args={[0.1, 0.06, 0.4]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 18]} />
            <meshBasicMaterial color="#ff5c1f" toneMapped={false} />
          </mesh>
        </group>
      );
    case "flamethrower":
      return (
        <group rotation={[Math.PI / 2 - 0.2, 0, 0]} position={[0, 0.05, 0.05]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.25]}>
            <cylinderGeometry args={[0.08, 0.08, 0.55, 14]} />
            <meshStandardMaterial color="#3a2a20" metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.06, 0.12, 14]} />
            <meshStandardMaterial color="#a04018" metalness={0.65} roughness={0.35} />
          </mesh>
          <mesh castShadow position={[0, -0.05, -0.18]}>
            <boxGeometry args={[0.18, 0.34, 0.24]} />
            <meshStandardMaterial color="#7a1a1a" roughness={0.55} metalness={0.2} />
          </mesh>
          <mesh castShadow position={[-0.12, 0.05, -0.18]}>
            <cylinderGeometry args={[0.06, 0.06, 0.32, 14]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[0.12, 0.05, -0.18]}>
            <cylinderGeometry args={[0.06, 0.06, 0.32, 14]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.25} />
          </mesh>
        </group>
      );
    case "squeaky":
      return (
        <group rotation={[0.3, 0.2, -0.15]}>
          <mesh castShadow position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.55, 12]} />
            <meshStandardMaterial color="#9a6a3a" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[0.32, 0.28, 0.4]} />
            <meshStandardMaterial color="#ff5c8a" emissive="#ff2a5a" emissiveIntensity={0.7} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.7, 0.22]}>
            <sphereGeometry args={[0.05, 14, 14]} />
            <meshBasicMaterial color="#fff" toneMapped={false} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}
