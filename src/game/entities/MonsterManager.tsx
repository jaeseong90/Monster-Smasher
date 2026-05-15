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
import { ding, hurt } from "../sounds";

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
    const count = Math.min(4 + wave * 2, 16);
    for (let i = 0; i < count; i++) {
      const r = rng();
      let type: MonsterDef["type"] = "blob";
      if (wave >= 2 && r > 0.7) type = "runner";
      if (wave >= 3 && r > 0.85) type = "tank";
      if (wave >= 2 && r > 0.55 && r < 0.7) type = "spike";
      const ang = rng() * Math.PI * 2;
      const dist = ARENA_RADIUS - 1.5 - rng() * 2;
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
  }, [waveDef, status, setAlive]);

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
    return () => {
      useNet.setState({ onHit: undefined });
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
      nextWave();
      ding();
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
    m.hp -= damage;
    m.wobble = 1;
    const ix = dirX * knock;
    const iz = dirZ * knock;
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
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.children[0].scale.y = 1 + Math.sin(performance.now() * 0.006) * 0.06;
    }
  });

  if (def.type === "spike") {
    return (
      <group ref={ref} scale={def.scale}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color={def.color} roughness={0.5} flatShading />
        </mesh>
        <mesh position={[0, 0.45, 0.3]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0, 0.45, 0.45]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      </group>
    );
  }
  if (def.type === "tank") {
    return (
      <group ref={ref} scale={def.scale}>
        <mesh castShadow position={[0, 0, 0]}>
          <sphereGeometry args={[0.7, 14, 14]} />
          <meshStandardMaterial color={def.color} roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.55, 0.45]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0, 0.55, 0.6]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshBasicMaterial color="#000" />
        </mesh>
        <mesh position={[-0.5, 0.3, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.18, 0.4, 5]} />
          <meshStandardMaterial color="#a04a18" />
        </mesh>
        <mesh position={[0.5, 0.3, 0]} rotation={[0, 0, 0.4]}>
          <coneGeometry args={[0.18, 0.4, 5]} />
          <meshStandardMaterial color="#a04a18" />
        </mesh>
      </group>
    );
  }
  if (def.type === "runner") {
    return (
      <group ref={ref} scale={def.scale}>
        <mesh castShadow>
          <capsuleGeometry args={[0.32, 0.4, 6, 10]} />
          <meshStandardMaterial color={def.color} roughness={0.5} />
        </mesh>
        <mesh position={[-0.1, 0.42, 0.27]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0.1, 0.42, 0.27]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[-0.1, 0.42, 0.33]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshBasicMaterial color="#000" />
        </mesh>
        <mesh position={[0.1, 0.42, 0.33]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      </group>
    );
  }
  if (def.type === "boss") {
    return (
      <group ref={ref} scale={def.scale}>
        <mesh castShadow>
          <sphereGeometry args={[0.6, 18, 14]} />
          <meshStandardMaterial color={def.color} roughness={0.55} emissive="#3a0010" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <coneGeometry args={[0.3, 0.55, 5]} />
          <meshStandardMaterial color="#3a0010" />
        </mesh>
        <mesh position={[-0.22, 0.45, 0.5]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0.22, 0.45, 0.5]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[-0.22, 0.45, 0.6]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh position={[0.22, 0.45, 0.6]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh position={[-0.6, -0.05, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.18, 0.55, 5]} />
          <meshStandardMaterial color="#7a0a20" />
        </mesh>
        <mesh position={[0.6, -0.05, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.18, 0.55, 5]} />
          <meshStandardMaterial color="#7a0a20" />
        </mesh>
      </group>
    );
  }
  return (
    <group ref={ref} scale={def.scale}>
      <mesh castShadow position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 14, 12]} />
        <meshStandardMaterial color={def.color} roughness={0.6} />
      </mesh>
      <mesh position={[-0.15, 0.35, 0.4]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      <mesh position={[0.15, 0.35, 0.4]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      <mesh position={[-0.15, 0.35, 0.48]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[0.15, 0.35, 0.48]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[0, 0.2, 0.48]}>
        <boxGeometry args={[0.18, 0.05, 0.02]} />
        <meshBasicMaterial color="#5b1a1a" />
      </mesh>
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
