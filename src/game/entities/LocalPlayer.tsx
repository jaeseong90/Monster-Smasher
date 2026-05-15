"use client";

import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CharacterModel, GroundShadow } from "./Character";
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
    if (status !== "playing") return;

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
    if (modelRef.current) {
      modelRef.current.position.set(t.x, t.y - 0.1, t.z);
      if (Math.abs(input.move.x) + Math.abs(input.move.y) > 0.05) {
        facing.current = Math.atan2(input.move.x, input.move.y);
      }
      modelRef.current.rotation.y = facing.current;
    }

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
    return () => window.removeEventListener("local-hit" as any, handler as any);
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
        <CharacterModel role={myRole} hitFlash={hitFlash.current} />
        <GroundShadow size={0.7} />
        <WeaponHeld weapon={myWeaponId} />
      </group>
    </>
  );
}

function WeaponHeld({ weapon }: { weapon: string }) {
  switch (weapon) {
    case "hammer":
      return (
        <group position={[0.45, 0.8, 0.25]} rotation={[0.4, 0.3, -0.2]}>
          <mesh castShadow position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
            <meshStandardMaterial color="#6a4a2e" />
          </mesh>
          <mesh castShadow position={[0, 0.85, 0]}>
            <boxGeometry args={[0.32, 0.32, 0.6]} />
            <meshStandardMaterial color="#7a7a82" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      );
    case "greatsword":
      return (
        <group position={[0.4, 0.7, 0.2]} rotation={[1.2, 0.3, 0]}>
          <mesh castShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[0.1, 1.1, 0.02]} />
            <meshStandardMaterial color="#dadada" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh castShadow position={[0, -0.05, 0]}>
            <boxGeometry args={[0.3, 0.06, 0.05]} />
            <meshStandardMaterial color="#7a5a3a" />
          </mesh>
        </group>
      );
    case "pan":
      return (
        <group position={[0.45, 0.7, 0.2]} rotation={[1, 0.3, 0]}>
          <mesh castShadow position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.06, 18]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh castShadow position={[0, 0.0, 0]}>
            <boxGeometry args={[0.08, 0.5, 0.05]} />
            <meshStandardMaterial color="#3a1a1a" />
          </mesh>
        </group>
      );
    case "leek":
      return (
        <group position={[0.4, 0.8, 0.2]} rotation={[1.2, 0.4, 0]}>
          <mesh castShadow position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.5, 8]} />
            <meshStandardMaterial color="#f8f8f0" />
          </mesh>
          <mesh castShadow position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.05, 0.04, 0.6, 8]} />
            <meshStandardMaterial color="#3fa54a" />
          </mesh>
        </group>
      );
    case "bazooka":
      return (
        <group position={[0.4, 0.9, 0.2]} rotation={[0, 0, 0]}>
          <mesh castShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.8, 14]} />
            <meshStandardMaterial color="#3a4a3a" />
          </mesh>
          <mesh castShadow position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.1, 14]} />
            <meshStandardMaterial color="#2a3a2a" />
          </mesh>
        </group>
      );
    case "flamethrower":
      return (
        <group position={[0.4, 0.85, 0.2]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
            <meshStandardMaterial color="#5b3a2a" metalness={0.4} />
          </mesh>
          <mesh castShadow position={[0, -0.05, -0.15]}>
            <boxGeometry args={[0.18, 0.32, 0.22]} />
            <meshStandardMaterial color="#a83a3a" />
          </mesh>
        </group>
      );
    case "squeaky":
      return (
        <group position={[0.4, 0.8, 0.2]} rotation={[0.4, 0.3, -0.2]}>
          <mesh castShadow position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
            <meshStandardMaterial color="#9a6a3a" />
          </mesh>
          <mesh castShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[0.32, 0.28, 0.4]} />
            <meshStandardMaterial color="#ff5c8a" emissive="#ff2a5a" emissiveIntensity={0.3} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}
