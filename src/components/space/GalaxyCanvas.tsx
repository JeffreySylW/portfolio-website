"use client";

import { Suspense, useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BODIES, type SpaceBody } from "@/content/space";
import {
  bodyPosition,
  cameraTargetFor,
  easeInOutCubic,
  flightDurationMs,
  flightPose,
  followPosition,
  orbitAngle,
  type Vec3,
} from "@/lib/cameraPath";
import { Starfield } from "./Starfield";

const HOME: { position: Vec3; lookAt: Vec3 } = { position: [0, 14, 22], lookAt: [0, 0, 0] };
// portrait: pull back (2x) so labelled orbits stay on screen; desktop unchanged
const homeFor = (aspect: number): { position: Vec3; lookAt: Vec3 } => {
  const k = Math.max(1, 2 / aspect);
  return { position: [0, HOME.position[1] * k, HOME.position[2] * k], lookAt: HOME.lookAt };
};

type Follow = { body: SpaceBody; cam: Vec3; angle0: number };
type Flight = {
  from: Vec3; to: Vec3; lookFrom: Vec3; lookTo: Vec3; start: number; duration: number;
  follow: Follow | null; id: string | null;
};

const speedOf = (b: SpaceBody) => (b.kind === "star" ? 0.01 : 0.05);

// Live world position, same maths as Body's useFrame.
function livePos(body: SpaceBody, t: number): Vec3 {
  const parent = body.parent ? BODIES.find((b) => b.id === body.parent) : undefined;
  const [x, y, z] = bodyPosition(body, t, body.kind === "star" ? 0.01 : 0.05);
  const o = parent ? bodyPosition(parent, t) : [0, 0, 0];
  return [x + o[0], y + o[1], z + o[2]];
}

function Body({ body, onSelect, labelFor, time }: {
  body: SpaceBody;
  onSelect: (id: string) => void;
  labelFor: (id: string) => ReactNode;
  time: MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const isStar = body.kind === "star";
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (isStar && mat.current) mat.current.emissiveIntensity = 1.6 + 0.6 * Math.sin(time.current * 1.5 + body.startAngleDeg);
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
        <meshStandardMaterial ref={mat} color={body.color} emissive={body.color} emissiveIntensity={isStar ? 2 : 0.3} roughness={0.7} />
      </mesh>
      {body.kind === "planet" && (
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

function MilkyWay() {
  const map = useLoader(THREE.TextureLoader, "/textures/milkyway-2k.jpg");
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[150, 48, 32]} />
      <meshBasicMaterial side={THREE.BackSide} color="#808080" depthWrite={false} fog={false}>
        <primitive object={map} attach="map" colorSpace={THREE.SRGBColorSpace} />
      </meshBasicMaterial>
    </mesh>
  );
}

function CameraRig({ target, reducedMotion, time: timeRef, onArrive }: {
  target: string | null;
  reducedMotion: boolean;
  time: MutableRefObject<number>;
  onArrive?: (id: string) => void;
}) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const flight = useRef<Flight | null>(null);
  const lastTarget = useRef<string | null>(null);
  const follow = useRef<Follow | null>(null);
  const arrive = useRef(onArrive);
  useEffect(() => { arrive.current = onArrive; });

  useEffect(() => {
    // initial placement / resize while at home
    if (lastTarget.current === null && !flight.current) {
      const h = homeFor(aspect);
      camera.position.set(...h.position);
      camera.lookAt(...h.lookAt);
    }
  }, [aspect, camera]);

  // camera position that tracks a followed body (arrival offset turned with its orbit)
  const followPos = (f: Follow, now: number): Vec3 =>
    followPosition(livePos(f.body, now), f.cam, orbitAngle(f.body, now, speedOf(f.body)) - f.angle0);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    timeRef.current = now;
    if (target !== lastTarget.current) {
      lastTarget.current = target;
      follow.current = null;
      const cur = camera.position.toArray() as Vec3;
      const look = new THREE.Vector3(0, 0, 0);
      camera.getWorldDirection(look);
      const lookNow = camera.position.clone().add(look).toArray() as Vec3;
      const home = homeFor(aspect);
      let to: Vec3 = home.position;
      let fol: Follow | null = null;
      const body = target && target !== "sun" ? BODIES.find((b) => b.id === target) : undefined;
      if (body) {
        const p = livePos(body, now);
        const pos = cameraTargetFor(p, body.kind === "star" ? 2.5 : 4).position;
        fol = { body, cam: [pos[0] - p[0], pos[1] - p[1], pos[2] - p[2]], angle0: orbitAngle(body, now, speedOf(body)) };
        to = pos;
      }
      if (reducedMotion) {
        camera.position.set(...to);
        camera.lookAt(0, 0, 0);
        flight.current = null;
        follow.current = fol;
      } else {
        flight.current = {
          from: cur,
          to,
          lookFrom: lookNow,
          lookTo: home.lookAt,
          start: now,
          duration: flightDurationMs(cur, to) / 1000,
          follow: fol,
          id: target,
        };
      }
    }
    const f = flight.current;
    if (f) {
      const t = Math.min(1, (now - f.start) / f.duration);
      // the end point is the live follow pose, so the hand-off to following has no step
      const end = f.follow ? followPos(f.follow, now) : f.to;
      const pose = flightPose(f.from, end, f.lookFrom, f.lookTo, easeInOutCubic(t));
      camera.position.set(...pose.position);
      camera.lookAt(...pose.lookAt);
      if (t >= 1) {
        flight.current = null;
        follow.current = f.follow;
        if (f.id) arrive.current?.(f.id);
      }
    } else if (follow.current) {
      camera.position.set(...followPos(follow.current, now));
      camera.lookAt(0, 0, 0); // face the sun while following
    }
  });
  return null;
}

export function GalaxyCanvas({ selectedId, onSelect, reducedMotion, paused = false, labelFor, onCreated, onArrive }: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  reducedMotion: boolean;
  paused?: boolean;
  labelFor: (id: string) => ReactNode;
  onCreated?: (canvas: HTMLCanvasElement) => void;
  onArrive?: (id: string) => void;
}) {
  const time = useRef(0);
  // drei Html swaps its mount target once the canvas is in the DOM, which empties the first label; mount bodies after that
  const [ready, setReady] = useState(false);

  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      camera={{ position: HOME.position, fov: 50, near: 0.1, far: 400 }}
      dpr={[1, 1.75]}
      onCreated={({ gl }) => { onCreated?.(gl.domElement); setReady(true); }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#03050b"]} />
      <Suspense fallback={null}><MilkyWay /></Suspense>
      <ambientLight intensity={0.15} />
      <Starfield reducedMotion={reducedMotion} />
      {ready && (
        <>
          <Sun onSelect={onSelect} labelFor={labelFor} />
          {BODIES.map((b) => (
            <Body key={b.id} body={b} onSelect={(id) => onSelect(id)} labelFor={labelFor} time={time} />
          ))}
        </>
      )}
      <CameraRig target={selectedId} reducedMotion={reducedMotion} time={time} onArrive={onArrive} />
    </Canvas>
  );
}
