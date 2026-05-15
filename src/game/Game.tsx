"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Scene } from "./Scene";
import { HUD } from "./hud/HUD";
import { TitleScreen } from "./hud/TitleScreen";
import { GameOverScreen } from "./hud/GameOverScreen";
import { MobileControls } from "./hud/MobileControls";
import { useGame } from "./store";
import "./input";

export default function Game() {
  const status = useGame((s) => s.status);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") setDebug((d) => !d);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 14, 14], fov: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0b0420"]} />
        <fog attach="fog" args={["#0b0420", 28, 60]} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -30, 0]} debug={debug}>
            <Scene />
          </Physics>
        </Suspense>
      </Canvas>

      {status === "title" && <TitleScreen />}
      {status === "playing" && (
        <>
          <HUD />
          <MobileControls />
        </>
      )}
      {status === "paused" && <PausedOverlay />}
      {status === "gameover" && <GameOverScreen />}
    </div>
  );
}

function PausedOverlay() {
  const resume = useGame((s) => s.resume);
  const reset = useGame((s) => s.reset);
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl bg-white/10 border border-white/20 p-6 text-center space-y-4">
        <h2 className="text-3xl font-bold text-amber-300">일시정지</h2>
        <div className="flex gap-3 justify-center">
          <button
            onClick={resume}
            className="px-5 py-2 rounded-xl bg-amber-400 text-black font-bold active:scale-95"
          >
            계속
          </button>
          <button
            onClick={reset}
            className="px-5 py-2 rounded-xl bg-white/15 text-white font-bold active:scale-95"
          >
            메인으로
          </button>
        </div>
      </div>
    </div>
  );
}
