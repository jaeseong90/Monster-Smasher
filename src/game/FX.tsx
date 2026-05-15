"use client";

import { EffectComposer, Bloom, Vignette, ChromaticAberration, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { Vector2 } from "three";
import { useMemo } from "react";

export function FX() {
  const offset = useMemo(() => new Vector2(0.0008, 0.0012), []);
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.85}
      />
      <ChromaticAberration
        offset={offset}
        radialModulation
        modulationOffset={0.4}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette eskil={false} offset={0.15} darkness={0.85} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
