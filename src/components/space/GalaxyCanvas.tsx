"use client";

import { Suspense, useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { BODIES, type SpaceBody } from "@/content/space";
import {
  bodyPosition,
  cameraTargetFor,
  easeInOutCubic,
  flightDurationMs,
  lerpVec,
  type Vec3,
} from "@/lib/cameraPath";
import { Starfield } from "./Starfield";

const HOME: { position: Vec3; lookAt: Vec3 } = { position: [0, 14, 22], lookAt: [0, 0, 0] };
// portrait: pull back (2x) so labelled orbits stay on screen; desktop unchanged
const homeFor = (aspect: number): { position: Vec3; lookAt: Vec3 } => {
  const k = Math.max(1, 2 / aspect);
  return { position: [0, HOME.position[1] * k, HOME.position[2] * k], lookAt: HOME.lookAt };
};

type Flight = { from: Vec3; to: Vec3; lookFrom: Vec3; lookTo: Vec3; start: number; duration: number };

// Live world position, same maths as Body's useFrame.
function livePos(body: SpaceBody, t: number): Vec3 {
  const parent = body.parent ? BODIES.find((b) => b.id === body.parent) : undefined;
  const [x, y, z] = bodyPosition(body, t, body.kind === "star" ? 0.01 : 0.05);
  const o = parent ? bodyPosition(parent, t) : [0, 0, 0];
  return [x + o[0], y + o[1], z + o[2]];
}

function TexturedMaterial({ url }: { url: string }) {
  const map = useTexture(url);
  return <meshStandardMaterial map={map} color="#ffffff" emissive="#ffffff" emissiveMap={map} emissiveIntensity={0.25} roughness={0.7} />;
}

function Body({ body, onSelect, labelFor, time }: {
  body: SpaceBody;
  onSelect: (id: string) => void;
  labelFor: (id: string) => ReactNode;
  time: MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const isStar = body.kind === "star";

  useFrame(() => {
    if (!group.current) return;
    const parent = body.parent ? BODIES.find((b) => b.id === body.parent) : undefined;
    const [x, y, z] = bodyPosition(body, time.current, isStar ? 0.01 : 0.05);
    group.current.position.set(x, y, z);
    if (parent) group.current.position.add(new THREE.Vector3(...bodyPosition(parent, time.current)));
  });

  return (
    <group ref={group} onClick={(e) => { e.stopPropagation(); onSelect(body.id); }}>
      <mesh>
        <sphereGeometry args={[body.size, 32, 32]} />
        {body.texture ? (
          <TexturedMaterial url={body.texture} />
        ) : (
          <meshStandardMaterial color={body.color} emissive={body.color} emissiveIntensity={isStar ? 2 : 0.25} roughness={0.7} />
        )}
      </mesh>
      {body.texture && (
        <mesh>
          <sphereGeometry args={[body.size * 1.08, 32, 32]} />
          <meshBasicMaterial color={body.color} side={THREE.BackSide} transparent opacity={0.15} depthWrite={false} />
        </mesh>
      )}
      <Html center>{labelFor(body.id)}</Html>
    </group>
  );
}

function Sun({ onSelect, labelFor }: { onSelect: (id: string | null) => void; labelFor: (id: string) => ReactNode }) {
  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect("sun"); }}>
      <mesh>
        <sphereGeometry args={[1.6, 48, 48]} />
        <meshStandardMaterial color="#f5b041" emissive="#f5b041" emissiveIntensity={1.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial color="#f5b041" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <pointLight color="#ffd9a0" intensity={40} distance={60} />
      <Html center>{labelFor("sun")}</Html>
    </group>
  );
}

function CameraRig({ target, reducedMotion, time: timeRef }: {
  target: string | null;
  reducedMotion: boolean;
  time: MutableRefObject<number>;
}) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const flight = useRef<Flight | null>(null);
  const lastTarget = useRef<string | null>(null);
  // arrival offsets (camera, lookAt) from the followed body's live position
  const pending = useRef<SpaceBody | null>(null);
  const follow = useRef<{ body: SpaceBody; cam: Vec3; look: Vec3 } | null>(null);

  useEffect(() => {
    // initial placement / resize while at home
    if (lastTarget.current === null && !flight.current) {
      const h = homeFor(aspect);
      camera.position.set(...h.position);
      camera.lookAt(...h.lookAt);
    }
  }, [aspect, camera]);

  useFrame(({ clock }) => {
    timeRef.current = clock.elapsedTime;
    if (target !== lastTarget.current) {
      lastTarget.current = target;
      follow.current = null;
      const cur = camera.position.toArray() as Vec3;
      const look = new THREE.Vector3(0, 0, 0);
      camera.getWorldDirection(look);
      const lookNow = camera.position.clone().add(look).toArray() as Vec3;
      let to: { position: Vec3; lookAt: Vec3 } = homeFor(aspect);
      pending.current = null;
      if (target && target !== "sun") {
        const body = BODIES.find((b) => b.id === target);
        if (body) {
          to = cameraTargetFor(livePos(body, clock.elapsedTime), body.kind === "star" ? 2.5 : 4);
          pending.current = body;
        }
      }
      if (reducedMotion) {
        camera.position.set(...to.position);
        camera.lookAt(...to.lookAt);
        flight.current = null;
      } else {
        flight.current = {
          from: cur,
          to: to.position,
          lookFrom: lookNow,
          lookTo: to.lookAt,
          start: clock.elapsedTime,
          duration: flightDurationMs(cur, to.position) / 1000,
        };
      }
    }
    const f = flight.current;
    if (f) {
      const t = Math.min(1, (clock.elapsedTime - f.start) / f.duration);
      const e = easeInOutCubic(t);
      camera.position.set(...lerpVec(f.from, f.to, e));
      camera.lookAt(...lerpVec(f.lookFrom, f.lookTo, e));
      if (t >= 1) {
        flight.current = null;
        const body = pending.current;
        if (body) {
          const p = livePos(body, clock.elapsedTime);
          follow.current = {
            body,
            cam: [f.to[0] - p[0], f.to[1] - p[1], f.to[2] - p[2]],
            look: [f.lookTo[0] - p[0], f.lookTo[1] - p[1], f.lookTo[2] - p[2]],
          };
        }
      }
    } else if (follow.current) {
      const { body, cam, look } = follow.current;
      const p = livePos(body, clock.elapsedTime);
      camera.position.set(p[0] + cam[0], p[1] + cam[1], p[2] + cam[2]);
      camera.lookAt(p[0] + look[0], p[1] + look[1], p[2] + look[2]);
    }
  });
  return null;
}

export function GalaxyCanvas({ selectedId, onSelect, reducedMotion, labelFor, onCreated }: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  reducedMotion: boolean;
  labelFor: (id: string) => ReactNode;
  onCreated?: (canvas: HTMLCanvasElement) => void;
}) {
  const time = useRef(0);

  return (
    <Canvas
      camera={{ position: HOME.position, fov: 50, near: 0.1, far: 200 }}
      dpr={[1, 1.75]}
      onCreated={({ gl }) => onCreated?.(gl.domElement)}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#03050b"]} />
      <ambientLight intensity={0.15} />
      <Starfield reducedMotion={reducedMotion} />
      <Sun onSelect={onSelect} labelFor={labelFor} />
      <Suspense fallback={null}>
        {BODIES.map((b) => (
          <Body key={b.id} body={b} onSelect={(id) => onSelect(id)} labelFor={labelFor} time={time} />
        ))}
      </Suspense>
      <CameraRig target={selectedId} reducedMotion={reducedMotion} time={time} />
    </Canvas>
  );
}
