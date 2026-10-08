"use client";

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { LIGHTING, type LightingPreset } from "./lighting";

export type Scene3DProps = {
  modelUrl: string;
  preset: LightingPreset;
  autoRotate: boolean;
  resetKey: number;
  onLoaded?: () => void;
  onInteract?: () => void;
  onError?: (message: string) => void;
};

function Lights({ preset }: { preset: LightingPreset }) {
  const cfg = LIGHTING[preset];
  return (
    <>
      <ambientLight intensity={cfg.ambient} />
      <directionalLight position={cfg.key.position} intensity={cfg.key.intensity} color={cfg.key.color} />
      <directionalLight position={cfg.fill.position} intensity={cfg.fill.intensity} color={cfg.fill.color} />
      <directionalLight position={cfg.rim.position} intensity={cfg.rim.intensity} color={cfg.rim.color} />
      {/* Entorno generado localmente con Lightformers: sin descargar HDRIs externos */}
      <Environment key={preset} resolution={256} frames={1} environmentIntensity={cfg.envIntensity}>
        {cfg.formers.map((f, i) => (
          <Lightformer
            key={i}
            form={f.form}
            color={f.color}
            intensity={f.intensity}
            position={f.position}
            scale={f.scale}
            target={[0, 0, 0]}
          />
        ))}
      </Environment>
    </>
  );
}

function Model({
  url,
  preset,
  onLoaded,
}: {
  url: string;
  preset: LightingPreset;
  onLoaded?: () => void;
}) {
  const { scene } = useGLTF(url);
  const cfg = LIGHTING[preset];

  const { object, scale, offset, halfHeight } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 1.6 / maxDim;
    return {
      object: clone,
      scale: s,
      offset: new THREE.Vector3(-center.x, -center.y, -center.z),
      halfHeight: (size.y * s) / 2,
    };
  }, [scene]);

  useEffect(() => {
    onLoaded?.();
  }, [object, onLoaded]);

  return (
    <>
      <group scale={scale}>
        <primitive object={object} position={offset} />
      </group>
      <ContactShadows
        position={[0, -halfHeight - 0.02, 0]}
        opacity={cfg.shadowOpacity}
        color={cfg.shadowColor}
        scale={4}
        blur={2.6}
        far={2}
        resolution={512}
      />
    </>
  );
}

function LoadingSkeleton() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.8;
    ref.current.rotation.x += delta * 0.25;
    ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.05);
  });
  // Sin <Html> de drei: su portal desmonta su propio root de React en el mismo
  // commit donde Suspense resuelve el modelo ("Attempted to synchronously unmount
  // a root while React was already rendering"). El % vive en LoadOverlay (DOM).
  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshBasicMaterial color="#8fa47d" wireframe transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

/** Overlay DOM con el progreso de carga. `useProgress` lee el store global del
 *  loading manager, así que funciona fuera del Canvas sin portales. */
function LoadOverlay() {
  const { active, progress } = useProgress();
  return (
    <div
      aria-hidden={!active}
      className={cn(
        "absolute inset-0 grid place-items-center transition-opacity duration-500",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="whitespace-nowrap rounded-full bg-white/85 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-tinta-500 shadow-sm backdrop-blur">
        Cargando 3D · {Math.round(progress)}%
      </div>
    </div>
  );
}

function ResetOnChange({ resetKey }: { resetKey: number }) {
  const controls = useThree((s) => s.controls) as unknown as { reset?: () => void } | null;
  const last = useRef(resetKey);
  useEffect(() => {
    if (last.current !== resetKey) {
      last.current = resetKey;
      controls?.reset?.();
    }
  }, [resetKey, controls]);
  return null;
}

class ModelErrorBoundary extends Component<
  { children: ReactNode; onError?: (message: string) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error("[Scene3D] No se pudo cargar el modelo 3D:", error);
    this.props.onError?.(error.message || "No se pudo cargar el modelo 3D");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Scene3D({
  modelUrl,
  preset,
  autoRotate,
  resetKey,
  onLoaded,
  onInteract,
  onError,
}: Scene3DProps) {
  return (
    <>
      <Canvas
        camera={{ position: [0.9, 0.55, 2.9], fov: 35, near: 0.05, far: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ touchAction: "none" }}
      >
        <Lights preset={preset} />
        <ModelErrorBoundary onError={onError}>
          <Suspense fallback={<LoadingSkeleton />}>
            <Model url={modelUrl} preset={preset} onLoaded={onLoaded} />
          </Suspense>
        </ModelErrorBoundary>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.5}
          maxDistance={6}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 1.85}
          autoRotate={autoRotate}
          autoRotateSpeed={1.1}
          onStart={onInteract}
        />
        <ResetOnChange resetKey={resetKey} />
      </Canvas>
      <LoadOverlay />
    </>
  );
}
