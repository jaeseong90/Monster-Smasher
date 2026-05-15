"use client";

import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mulberry32 } from "../rand";
import { useGame, WEAPONS } from "../store";
import { useNet } from "../net";
import { useAttackBus, type AttackPing } from "./AttackBus";
import { AttackVisuals, spawnExplosion, spawnSqueak, attackStore } from "./Attacks";
import { ARENA_RADIUS } from "../world/Arena";
import { ding, hurt, bossRoar, fanfare } from "../sounds";
import { useShake } from "../camera";

interface MonsterDef {
  type: "blob" | "spike" | "tank" | "runner" | "boss";
  hp: number;
  speed: number;
  damage: number;
  color: string;
  scale: number;
  score: number;
}

const TYPES: Record<MonsterDef["type"], MonsterDef> = {
  blob: { type: "blob", hp: 30, speed: 1.6, damage: 8, color: "#7a3cff", scale: 0.9, score: 10 },
  runner: { type: "runner", hp: 18, speed: 3.2, damage: 6, color: "#ff5cbd", scale: 0.7, score: 15 },
  tank: { type: "tank", hp: 80, speed: 1.0, damage: 15, color: "#ff8a3a", scale: 1.4, score: 30 },
  spike: { type: "spike", hp: 24, speed: 2.0, damage: 12, color: "#3affb0", scale: 0.9, score: 20 },
  boss: { type: "boss", hp: 400, speed: 0.7, damage: 20, color: "#ff2a4a", scale: 2.4, score: 200 },
};

interface Monster {
  id: number;
  def: MonsterDef;
  body: RapierRigidBody | null;
  hp: number;
  born: number;
  wobble: number;
  lastAttack: number;
}

interface Props {
  playerRef: React.MutableRefObject<THREE.Vector3>;
}

let monsterId = 0;

export function MonsterManager({ playerRef }: Props) {
  const wave = useGame((s) => s.wave);
  const status = useGame((s) => s.status);
  const addScore = useGame((s) => s.addScore);
  const bumpCombo = useGame((s) => s.bumpCombo);
  const killMonster = useGame((s) => s.killMonster);
  const nextWave = useGame((s) => s.nextWave);
  const setAlive = useGame((s) => s.setAlive);
  const pushFloater = useGame((s) => s.pushFloater);

  const seedBase = useNet((s) => s.worldSeed) || 12345;
  const isHost = useNet((s) => s.isHost) || !useNet.getState().enabled;

  const [monsters, setMonsters] = useState<{ id: number; def: MonsterDef; spawn: [number, number, number] }[]>([]);
  const bodiesRef = useRef<Map<number, RapierRigidBody>>(new Map());
  const monstersRef = useRef<Map<number, Monster>>(new Map());
  const remote = useNet((s) => s.remote);
  const enabled = useNet((s) => s.enabled);
  const broadcastMonsters = useNet((s) => s.broadcastMonsters);

  const waveDef = useMemo(() => {
    const rng = mulberry32(seedBase + wave * 17);
    const isBoss = wave % 5 === 0;
    const list: { id: number; def: MonsterDef; spawn: [number, number, number] }[] = [];
    if (isBoss) {
      list.push({
        id: ++monsterId,
        def: { ...TYPES.boss, hp: 400 + wave * 60 },
        spawn: [0, 1.4, -8],
      });
      const minions = Math.min(4, Math.floor(wave / 2));
      for (let i = 0; i < minions; i++) {
        const ang = rng() * Math.PI * 2;
        list.push({
          id: ++monsterId,
          def: TYPES.runner,
          spawn: [Math.cos(ang) * (ARENA_RADIUS - 3), 1.0, Math.sin(ang) * (ARENA_RADIUS - 3)],
        });
      }
      return list;
    }
    const count = wave === 1 ? 4 : Math.min(3 + wave * 2, 16);
    for (let i = 0; i < count; i++) {
      const r = rng();
      let type: MonsterDef["type"] = "blob";
      if (wave >= 3 && r > 0.72) type = "runner";
      if (wave >= 4 && r > 0.86) type = "tank";
      if (wave >= 2 && r > 0.6 && r < 0.72) type = "spike";
      const baseAng = (i / count) * Math.PI * 2;
      const jitter = (rng() - 0.5) * (Math.PI * 2 / count);
      const ang = baseAng + jitter;
      const dist = 10.5 + rng() * 3;
      list.push({
        id: ++monsterId,
        def: TYPES[type],
        spawn: [Math.cos(ang) * dist, 1.0, Math.sin(ang) * dist],
      });
    }
    return list;
  }, [wave, seedBase]);

  useEffect(() => {
    if (status !== "playing") return;
    setMonsters(waveDef);
    setAlive(waveDef.length);
    bodiesRef.current.clear();
    monstersRef.current.clear();
    if (wave % 5 === 0) {
      bossRoar();
      useShake.getState().add(1.0);
    } else {
      fanfare();
    }
  }, [waveDef, status, setAlive, wave]);

  const pushAttack = useAttackBus((s) => s.push);
  const prune = useAttackBus((s) => s.prune);
  const consume = useAttackBus((s) => s.consume);

  useEffect(() => {
    const fn = (a: any) => {
      pushAttack({ ...a, from: "remote" });
    };
    useNet.setState({ onAttack: fn });
    return () => {
      useNet.setState({ onAttack: undefined });
    };
  }, [pushAttack]);

  useEffect(() => {
    const fn = (h: any) => {
      const body = bodiesRef.current.get(h.monsterId);
      const m = monstersRef.current.get(h.monsterId);
      if (body && m) {
        body.applyImpulse({ x: h.knockX, y: 3, z: h.knockZ }, true);
        m.hp -= h.damage;
        if (h.killed) {
          fadeOutMonster(h.monsterId);
        }
      }
    };
    useNet.setState({ onHit: fn });

    const onWave = (w: number) => {
      useGame.getState().setWave(w);
    };
    useNet.setState({ onWave });

    return () => {
      useNet.setState({ onHit: undefined, onWave: undefined });
    };
  }, []);

  useFrame((_, dt) => {
    prune();
    if (status !== "playing") return;
    const playerPos = playerRef.current;
    const remotePos = remote ? new THREE.Vector3(remote.x, 0, remote.z) : null;
    let alive = 0;

    monstersRef.current.forEach((m, id) => {
      if (!m.body) return;
      alive++;
      const t = m.body.translation();
      const v = m.body.linvel();

      const targetH = playerPos.clone();
      const targetR = remotePos;
      const closer =
        targetR && remotePos && remotePos.distanceTo(new THREE.Vector3(t.x, 0, t.z)) <
          targetH.distanceTo(new THREE.Vector3(t.x, 0, t.z))
          ? targetR
          : targetH;
      const dx = closer.x - t.x;
      const dz = closer.z - t.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.001) {
        const speed = m.def.speed * (m.def.type === "runner" && Math.random() < 0.02 ? 2 : 1);
        const fx = (dx / dist) * speed;
        const fz = (dz / dist) * speed;
        m.body.setLinvel({ x: v.x * 0.85 + fx * 1.0, y: v.y, z: v.z * 0.85 + fz * 1.0 }, true);
      }

      if (m.wobble > 0) m.wobble = Math.max(0, m.wobble - dt * 2);

      const r = Math.hypot(t.x, t.z);
      if (r > ARENA_RADIUS - 0.4) {
        const nx = t.x / r;
        const nz = t.z / r;
        m.body.setTranslation({ x: nx * (ARENA_RADIUS - 0.4), y: t.y, z: nz * (ARENA_RADIUS - 0.4) }, true);
      }

      m.lastAttack += dt;
      if (dist < 1.0 && m.lastAttack > 1.0) {
        m.lastAttack = 0;
        const evt = new CustomEvent("local-hit", { detail: { amount: m.def.damage } });
        window.dispatchEvent(evt);
        hurt();
      }
    });

    setAlive(alive);

    if (alive === 0 && monsters.length > 0 && isHost) {
      const justBeatBoss = wave % 5 === 0;
      const enabled2 = useNet.getState().enabled && useNet.getState().remote;
      if (justBeatBoss && enabled2) {
        useGame.getState().startChorePvp();
      } else {
        nextWave();
        ding();
      }
    }

    const bus = useAttackBus.getState();
    const now = performance.now();
    for (const ping of bus.pings) {
      if (ping.consumed) continue;
      if (now - ping.t > 80) {
        consume(ping.id);
        applyAttack(ping);
      }
    }

    if (enabled && isHost) {
      hostBroadcastTick.current += dt;
      if (hostBroadcastTick.current > 0.1) {
        hostBroadcastTick.current = 0;
        const list: any[] = [];
        monstersRef.current.forEach((m, id) => {
          if (!m.body) return;
          const t = m.body.translation();
          list.push({ id, x: t.x, z: t.z, rot: 0, hp: m.hp, type: m.def.type });
        });
        broadcastMonsters(list);
      }
    }
  });

  const hostBroadcastTick = useRef(0);

  function applyAttack(ping: AttackPing) {
    const def = WEAPONS[ping.weapon];
    if (def.ranged) return;
    const ang = Math.atan2(ping.dirX, ping.dirZ);
    monstersRef.current.forEach((m, id) => {
      if (!m.body) return;
      const t = m.body.translation();
      const dx = t.x - ping.x;
      const dz = t.z - ping.z;
      const dist = Math.hypot(dx, dz);
      if (dist > def.range) return;
      const mang = Math.atan2(dx, dz);
      let diff = mang - ang;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > def.arc) return;
      hitMonster(id, m, def.damage, def.knockback, ping.dirX, ping.dirZ, ping.from);
      if (def.squeaky) spawnSqueak([t.x, 0.6, t.z]);
    });
  }

  function hitMonster(
    id: number,
    m: Monster,
    damage: number,
    knock: number,
    dirX: number,
    dirZ: number,
    from: "me" | "remote"
  ) {
    if (!m.body) return;
    const bonus = useGame.getState().partnerBonus ? 1.5 : 1;
    const effDamage = damage * bonus;
    m.hp -= effDamage;
    m.wobble = 1;
    const ix = dirX * knock * bonus;
    const iz = dirZ * knock * bonus;
    m.body.applyImpulse({ x: ix, y: 4 + knock * 0.2, z: iz }, true);
    m.body.applyTorqueImpulse({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 8, z: (Math.random() - 0.5) * 6 }, true);
    const killed = m.hp <= 0;
    if (from === "me") {
      const score = m.def.score * (killed ? 2 : 1);
      addScore(score);
      bumpCombo();
      pushFloater({
        text: killed ? `+${score}` : `-${damage}`,
        pos: [m.body.translation().x, 1.6, m.body.translation().z],
        color: killed ? "#ffe066" : "#ff7aa6",
      });
    }
    if (killed) {
      const t = m.body.translation();
      const r = Math.random();
      const isBoss = m.def.type === "boss";
      if (isBoss) {
        useGame.getState().dropItem("heart", t.x, t.z);
        useGame.getState().dropItem("star", t.x + 0.6, t.z);
        useGame.getState().dropItem("star", t.x - 0.6, t.z);
      } else if (r < 0.08) {
        useGame.getState().dropItem("heart", t.x, t.z);
      } else if (r < 0.20) {
        useGame.getState().dropItem("star", t.x, t.z);
      } else if (r < 0.30) {
        useGame.getState().dropItem("ammo", t.x, t.z);
      }
      fadeOutMonster(id);
      killMonster();
    }
    if (useNet.getState().enabled) {
      useNet.getState().broadcastHit({
        from: useNet.getState().myId,
        monsterId: id,
        damage,
        knockX: ix,
        knockZ: iz,
        killed,
      });
    }
  }

  function fadeOutMonster(id: number) {
    setTimeout(() => {
      setMonsters((arr) => arr.filter((mm) => mm.id !== id));
      bodiesRef.current.delete(id);
      monstersRef.current.delete(id);
    }, 60);
  }

  return (
    <group>
      {monsters.map((m) => (
        <MonsterBody
          key={m.id}
          id={m.id}
          def={m.def}
          spawn={m.spawn}
          onReady={(body) => {
            bodiesRef.current.set(m.id, body);
            monstersRef.current.set(m.id, {
              id: m.id,
              def: m.def,
              body,
              hp: m.def.hp,
              born: performance.now(),
              wobble: 0,
              lastAttack: 0,
            });
          }}
        />
      ))}
      <AttackVisuals />
      <ProjectileTicker bodies={bodiesRef} monsters={monstersRef} />
    </group>
  );
}

function MonsterBody({
  id,
  def,
  spawn,
  onReady,
}: {
  id: number;
  def: MonsterDef;
  spawn: [number, number, number];
  onReady: (b: RapierRigidBody) => void;
}) {
  const ref = useRef<RapierRigidBody>(null);
  useEffect(() => {
    if (ref.current) onReady(ref.current);
  }, [onReady]);

  return (
    <RigidBody
      ref={ref}
      colliders={false}
      position={spawn}
      mass={1.4}
      linearDamping={0.6}
      angularDamping={0.4}
      userData={{ tag: "monster", id }}
    >
      <CapsuleCollider args={[0.3 * def.scale, 0.45 * def.scale]} />
      <MonsterMesh def={def} />
    </RigidBody>
  );
}

function MonsterMesh({ def }: { def: MonsterDef }) {
  const ref = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Mesh>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const jawRef = useRef<THREE.Group>(null!);
  const phase = useRef(Math.random() * Math.PI * 2);

  useFrame((_, dt) => {
    phase.current += dt;
    const t = phase.current;
    if (bodyRef.current) {
      const sq = 1 + Math.sin(t * 6) * 0.08;
      bodyRef.current.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    }
    if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 12) * 0.45;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(t * 12) * 0.45;
    if (jawRef.current) {
      jawRef.current.rotation.x = 0.18 + Math.abs(Math.sin(t * 4)) * 0.18;
    }
  });

  if (def.type === "spike") {
    return (
      <group ref={ref} scale={def.scale}>
        <mesh castShadow ref={bodyRef}>
          <icosahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color={def.color}
            roughness={0.35}
            metalness={0.35}
            flatShading
            emissive={def.color}
            emissiveIntensity={0.35}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.28, 0]} />
          <meshBasicMaterial color="#aaffd8" toneMapped={false} transparent opacity={0.85} />
        </mesh>
        <mesh position={[-0.1, 0.18, 0.42]}>
          <sphereGeometry args={[0.07, 14, 14]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[0.1, 0.18, 0.42]}>
          <sphereGeometry args={[0.07, 14, 14]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[-0.1, 0.18, 0.48]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#1a0a14" />
        </mesh>
        <mesh position={[0.1, 0.18, 0.48]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#1a0a14" />
        </mesh>
      </group>
    );
  }
  if (def.type === "tank") {
    return (
      <group ref={ref} scale={def.scale}>
        <mesh castShadow position={[0, -0.15, 0]} ref={bodyRef}>
          <sphereGeometry args={[0.7, 22, 18]} />
          <meshStandardMaterial color={def.color} roughness={0.55} metalness={0.18} emissive="#5a1a00" emissiveIntensity={0.2} />
        </mesh>
        <mesh castShadow position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.55, 22, 18]} />
          <meshStandardMaterial color={def.color} roughness={0.55} metalness={0.18} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh
              key={i}
              castShadow
              position={[Math.cos(a) * 0.68, -0.05, Math.sin(a) * 0.68]}
              rotation={[0, -a, Math.PI / 6]}
            >
              <coneGeometry args={[0.16, 0.42, 6]} />
              <meshStandardMaterial color="#3a1810" roughness={0.45} metalness={0.6} />
            </mesh>
          );
        })}
        <group ref={jawRef} position={[0, 0.0, 0.5]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.1, 0.2]} />
            <meshStandardMaterial color="#3a1010" roughness={0.4} />
          </mesh>
          <mesh position={[-0.12, 0.05, 0.1]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.04, 0.1, 4]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[0, 0.05, 0.1]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.04, 0.1, 4]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[0.12, 0.05, 0.1]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.04, 0.1, 4]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
        <mesh position={[-0.18, 0.45, 0.48]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ff7a00" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <mesh position={[0.18, 0.45, 0.48]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ff7a00" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <mesh position={[-0.18, 0.45, 0.55]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#1a0a14" />
        </mesh>
        <mesh position={[0.18, 0.45, 0.55]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#1a0a14" />
        </mesh>
      </group>
    );
  }
  if (def.type === "runner") {
    return (
      <group ref={ref} scale={def.scale}>
        <mesh castShadow ref={bodyRef}>
          <capsuleGeometry args={[0.3, 0.42, 10, 18]} />
          <meshStandardMaterial color={def.color} roughness={0.4} metalness={0.2} emissive={def.color} emissiveIntensity={0.3} />
        </mesh>
        <group ref={leftLegRef} position={[-0.22, -0.32, 0]}>
          <mesh castShadow position={[0, -0.18, 0.1]} rotation={[0.6, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.03, 0.36, 8]} />
            <meshStandardMaterial color="#3a0a24" roughness={0.45} metalness={0.4} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.22, -0.32, 0]}>
          <mesh castShadow position={[0, -0.18, 0.1]} rotation={[0.6, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.03, 0.36, 8]} />
            <meshStandardMaterial color="#3a0a24" roughness={0.45} metalness={0.4} />
          </mesh>
        </group>
        <mesh castShadow position={[-0.22, -0.35, -0.05]} rotation={[-0.4, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.025, 0.3, 8]} />
          <meshStandardMaterial color="#3a0a24" roughness={0.45} metalness={0.4} />
        </mesh>
        <mesh castShadow position={[0.22, -0.35, -0.05]} rotation={[-0.4, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.025, 0.3, 8]} />
          <meshStandardMaterial color="#3a0a24" roughness={0.45} metalness={0.4} />
        </mesh>
        <mesh position={[-0.1, 0.4, 0.28]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ff5cbd" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        <mesh position={[0.1, 0.4, 0.28]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ff5cbd" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        <mesh position={[-0.1, 0.4, 0.34]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color="#1a0a14" />
        </mesh>
        <mesh position={[0.1, 0.4, 0.34]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color="#1a0a14" />
        </mesh>
        <mesh castShadow position={[0, 0.62, 0.1]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.05, 0.4, 5]} />
          <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.6} />
        </mesh>
      </group>
    );
  }
  if (def.type === "boss") {
    return (
      <group ref={ref} scale={def.scale}>
        <mesh castShadow ref={bodyRef}>
          <sphereGeometry args={[0.65, 32, 24]} />
          <meshStandardMaterial
            color={def.color}
            roughness={0.45}
            metalness={0.18}
            emissive="#5a0010"
            emissiveIntensity={0.55}
          />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 1.4 - Math.PI * 0.7;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.7, 0.6, Math.cos(a) * 0.7]} rotation={[0, -a, 0]}>
              <torusGeometry args={[0.25, 0.04, 6, 18]} />
              <meshBasicMaterial color="#ff1a40" toneMapped={false} transparent opacity={0.8} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.85, 0]}>
          <coneGeometry args={[0.32, 0.6, 6]} />
          <meshStandardMaterial color="#2a0008" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.08, 14, 14]} />
          <meshBasicMaterial color="#ff1a40" toneMapped={false} />
        </mesh>
        <mesh position={[-0.45, 0.4, 0.35]} rotation={[0.6, -0.4, -0.7]}>
          <coneGeometry args={[0.12, 0.55, 6]} />
          <meshStandardMaterial color="#2a0008" roughness={0.4} metalness={0.55} />
        </mesh>
        <mesh position={[0.45, 0.4, 0.35]} rotation={[0.6, 0.4, 0.7]}>
          <coneGeometry args={[0.12, 0.55, 6]} />
          <meshStandardMaterial color="#2a0008" roughness={0.4} metalness={0.55} />
        </mesh>
        <group ref={jawRef} position={[0, -0.18, 0.55]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.12, 0.22]} />
            <meshStandardMaterial color="#3a0008" roughness={0.4} />
          </mesh>
          {[-0.14, -0.04, 0.06, 0.14].map((x) => (
            <mesh key={x} position={[x, 0.06, 0.1]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.04, 0.12, 4]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
          ))}
        </group>
        <mesh position={[-0.22, 0.18, 0.55]}>
          <sphereGeometry args={[0.13, 18, 18]} />
          <meshStandardMaterial color="#ffffff" emissive="#ff1a40" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh position={[0.22, 0.18, 0.55]}>
          <sphereGeometry args={[0.13, 18, 18]} />
          <meshStandardMaterial color="#ffffff" emissive="#ff1a40" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh position={[-0.22, 0.18, 0.65]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshBasicMaterial color="#1a0008" />
        </mesh>
        <mesh position={[0.22, 0.18, 0.65]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshBasicMaterial color="#1a0008" />
        </mesh>
        <mesh position={[-0.65, -0.1, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.2, 0.6, 6]} />
          <meshStandardMaterial color="#3a000a" roughness={0.4} metalness={0.55} />
        </mesh>
        <mesh position={[0.65, -0.1, 0]} rotation={[0, 0, 0.6]}>
          <coneGeometry args={[0.2, 0.6, 6]} />
          <meshStandardMaterial color="#3a000a" roughness={0.4} metalness={0.55} />
        </mesh>
        <pointLight position={[0, 0.3, 0.6]} color="#ff1a40" intensity={8} distance={6} />
      </group>
    );
  }
  return (
    <group ref={ref} scale={def.scale}>
      <mesh castShadow position={[0, -0.05, 0]} ref={bodyRef}>
        <sphereGeometry args={[0.55, 24, 20]} />
        <meshStandardMaterial
          color={def.color}
          roughness={0.45}
          metalness={0.15}
          transparent
          opacity={0.92}
          emissive={def.color}
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.32, 18, 18]} />
        <meshBasicMaterial color="#e8d4ff" toneMapped={false} transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.15, 0.32, 0.4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <mesh position={[0.15, 0.32, 0.4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <mesh position={[-0.15, 0.32, 0.48]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#1a0a14" />
      </mesh>
      <mesh position={[0.15, 0.32, 0.48]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#1a0a14" />
      </mesh>
      <group ref={jawRef} position={[0, 0.16, 0.4]}>
        <mesh>
          <boxGeometry args={[0.22, 0.06, 0.08]} />
          <meshStandardMaterial color="#5b1a1a" emissive="#3a0a10" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function ProjectileTicker({
  bodies,
  monsters,
}: {
  bodies: React.MutableRefObject<Map<number, RapierRigidBody>>;
  monsters: React.MutableRefObject<Map<number, Monster>>;
}) {
  const addScore = useGame((s) => s.addScore);
  const bumpCombo = useGame((s) => s.bumpCombo);
  const pushFloater = useGame((s) => s.pushFloater);
  const killMonsterFn = useGame((s) => s.killMonster);

  useFrame((_, dt) => {
    const { projectiles } = attackStore.getState();
    if (!projectiles.length) return;
    const next: typeof projectiles = [];
    for (const p of projectiles) {
      if (p.exploded) {
        next.push(p);
        continue;
      }
      p.pos[0] += p.vel[0] * dt;
      p.pos[2] += p.vel[1] * dt;
      let hit = false;
      monsters.current.forEach((m, id) => {
        if (!m.body || hit) return;
        const t = m.body.translation();
        const d = Math.hypot(t.x - p.pos[0], t.z - p.pos[2]);
        if (d < 0.8) hit = true;
      });
      const r = Math.hypot(p.pos[0], p.pos[2]);
      if (hit || r > 18 || performance.now() - p.born > p.ttl) {
        spawnExplosion([p.pos[0], p.pos[1], p.pos[2]], 4.0);
        // 폭발 충격파가 플레이어도 날려버림 (자기 자신 포함). 정통 부부 게임의 묘미.
        const ev = new CustomEvent("explosion-blast", {
          detail: { x: p.pos[0], z: p.pos[2], radius: 4.0, force: 18, owner: p.owner },
        });
        window.dispatchEvent(ev);
        monsters.current.forEach((m, id) => {
          if (!m.body) return;
          const t = m.body.translation();
          const d = Math.hypot(t.x - p.pos[0], t.z - p.pos[2]);
          if (d < 4.0) {
            const fall = 1 - d / 4.0;
            const damage = 60 * fall;
            const knock = 45 * fall;
            const dirx = (t.x - p.pos[0]) / Math.max(0.001, d);
            const dirz = (t.z - p.pos[2]) / Math.max(0.001, d);
            m.body.applyImpulse({ x: dirx * knock, y: 10 + knock * 0.3, z: dirz * knock }, true);
            m.body.applyTorqueImpulse({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8, z: (Math.random() - 0.5) * 8 }, true);
            m.hp -= damage;
            if (p.owner === "me") {
              const killed = m.hp <= 0;
              const s = (m.def.score * (killed ? 2 : 1)) | 0;
              addScore(s);
              bumpCombo();
              pushFloater({
                text: killed ? `+${s}` : `-${damage | 0}`,
                pos: [t.x, 1.6, t.z],
                color: killed ? "#ffe066" : "#ff7aa6",
              });
              if (killed) {
                killMonsterFn();
                setTimeout(() => {
                  monsters.current.delete(id);
                  bodies.current.delete(id);
                }, 60);
              }
            }
          }
        });
        p.exploded = true;
      }
      next.push(p);
    }
    attackStore.setState({ projectiles: next.filter((p) => !p.exploded || performance.now() - p.born < p.ttl) });
  });

  return null;
}
