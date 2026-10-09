"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Seeded PRNG (mulberry32): deterministic field, same on every load.
function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Starfield({
  count = 2000,
  radius = 60,
  reducedMotion,
}: {
  count?: number;
  radius?: number;
  reducedMotion: boolean;
}) {
  const material = useRef<THREE.PointsMaterial>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const random = mulberry32(1);
    for (let i = 0; i < count; i++) {
      // Random points on a shell, denser toward the galactic plane.
      const u = random() * 2 - 1;
      const theta = random() * Math.PI * 2;
      const r = radius * Math.cbrt(random());
      const flatten = 0.35;
      positions[i * 3] = Math.sqrt(1 - u * u) * Math.cos(theta) * r;
      positions[i * 3 + 1] = u * r * flatten;
      positions[i * 3 + 2] = Math.sqrt(1 - u * u) * Math.sin(theta) * r;
      const tint = 0.75 + random() * 0.25;
      colors[i * 3] = tint;
      colors[i * 3 + 1] = tint;
      colors[i * 3 + 2] = 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count, radius]);

  useFrame(({ clock }) => {
    if (reducedMotion || !material.current) return;
    // Gentle global shimmer so the field twinkles.
    material.current.opacity = 0.75 + Math.sin(clock.elapsedTime * 1.3) * 0.2;
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={material}
        size={0.12}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}
