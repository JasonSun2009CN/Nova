import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ElementRef, type RefObject } from 'react';

import { StarInfoCard } from '@/components/StarMap/StarInfoCard';
import { StarCatalog, type Star } from '@/engine';
import { STARS_500_FIXTURE } from '@/engine/data/__fixtures__/stars-500';
import { FollowStarBridge } from '@/engine/renderer/FollowStarBridge';
import { CurrentPositionMarker, DestinationMarker } from '@/engine/renderer/MapMarkers';
import { PickController } from '@/engine/renderer/PickController';
import { StarField } from '@/engine/renderer/StarField';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useVoyageStore } from '@/store/useVoyageStore';
import { installStarMapHooks, uninstallStarMapHooks } from '@/test/star-map-hooks';

type OrbitControlsHandle = ElementRef<typeof OrbitControls>;

const NAV_MAX_DISTANCE_LY = 100;
const NAV_SCALE = 45 / NAV_MAX_DISTANCE_LY;
const SUN_RENDER_MAGNITUDE = 1.5;

function starDistanceLy(star: Star): number {
  const c = star.coords.cartesian;
  return Math.hypot(c.xLy, c.yLy, c.zLy);
}

function StarMapHookBridge({
  stars,
  scale,
  controlsRef,
}: {
  stars: readonly Star[];
  scale: number;
  controlsRef: RefObject<OrbitControlsHandle | null>;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    installStarMapHooks(() => ({
      camera,
      canvas: gl.domElement,
      width,
      height,
      stars,
      scale,
      setAutoRotate: (enabled: boolean) => {
        const controls = controlsRef.current;
        if (controls != null) controls.autoRotate = enabled;
      },
    }));
    return () => {
      uninstallStarMapHooks();
    };
  }, [camera, gl, width, height, stars, scale, controlsRef]);

  return null;
}

export function StarMapView({ onClose }: { onClose?: () => void }) {
  const [catalog, setCatalog] = useState<StarCatalog | null>(null);
  const [selected, setSelected] = useState<Star | null>(null);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const isLargeScreen = useMediaQuery('(min-width: 768px)');
  const controlsRef = useRef<OrbitControlsHandle | null>(null);
  const followRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    const catalogInstance = new StarCatalog();
    void catalogInstance.load(STARS_500_FIXTURE).then(() => {
      if (active) setCatalog(catalogInstance);
    });
    return () => {
      active = false;
    };
  }, []);

  const { navStars, bgStars } = useMemo(() => {
    if (catalog == null) {
      return { navStars: [] as Star[], bgStars: [] as Star[] };
    }
    const nav: Star[] = [];
    const bg: Star[] = [];
    for (const s of catalog.allStars) {
      if (s.id === 'hip-sol') continue;
      if (s.properName != null && starDistanceLy(s) <= NAV_MAX_DISTANCE_LY) {
        nav.push(s);
      } else {
        bg.push(s);
      }
    }
    return { navStars: nav, bgStars: bg };
  }, [catalog]);

  const destStar = useMemo(
    () => navStars.find((s) => s.id === destStarId) ?? null,
    [navStars, destStarId],
  );

  const sunStar = useMemo(
    () => catalog?.allStars.find((s) => s.id === 'hip-sol') ?? null,
    [catalog],
  );

  const sunRenderStars = useMemo(
    () => (sunStar == null ? [] : [{ ...sunStar, apparentMagnitude: SUN_RENDER_MAGNITUDE }]),
    [sunStar],
  );

  const pickableStars = useMemo(() => {
    const rest = navStars.concat(bgStars);
    return sunStar == null ? rest : [sunStar, ...rest];
  }, [sunStar, navStars, bgStars]);

  const handlePick = (star: Star | null) => {
    setSelected(star);
  };

  const handleClose = () => {
    setSelected(null);
  };

  const handleComplete = () => {
    setSelected(null);
    onClose?.();
  };

  return (
    <section data-testid="starmap-view" className="relative h-full w-full flex-1 animate-fade-up">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, var(--color-deep-900) 0%, var(--color-deep-950) 58%)',
        }}
      />
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 40], fov: 50, near: 0.1, far: 500 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
        >
          <StarField stars={bgStars} scale={NAV_SCALE} />
          <StarField stars={sunRenderStars} scale={NAV_SCALE} />
          <StarField stars={navStars} scale={NAV_SCALE} />
          <CurrentPositionMarker />
          {destStar != null && <DestinationMarker star={destStar} scale={NAV_SCALE} />}
          <PickController stars={pickableStars} scale={NAV_SCALE} onPick={handlePick} />
          <FollowStarBridge star={selected} scale={NAV_SCALE} targetRef={followRef} />
          <StarMapHookBridge stars={navStars} scale={NAV_SCALE} controlsRef={controlsRef} />
          <OrbitControls
            ref={controlsRef}
            enablePan
            enableZoom
            minDistance={8}
            maxDistance={220}
            autoRotate
            autoRotateSpeed={0.4}
          />
        </Canvas>
      </div>

      {selected != null &&
        (isLargeScreen ? (
          <div className="pointer-events-none absolute bottom-6 left-6 z-10">
            <StarInfoCard star={selected} onClose={handleClose} onComplete={handleComplete} />
          </div>
        ) : (
          <div ref={followRef} className="pointer-events-none absolute left-0 top-0 z-10 hidden">
            <StarInfoCard star={selected} onClose={handleClose} onComplete={handleComplete} />
          </div>
        ))}

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <p className="glass-card rounded-full px-4 py-1.5 text-xs text-deep-400">
          拖拽旋转 · 滚轮缩放 · 点击恒星查看信息 · {catalog?.size ?? 0} 颗恒星
        </p>
      </div>

      <div className="pointer-events-none absolute right-6 top-6 z-10">
        <p className="glass-card rounded-full px-4 py-1.5 text-xs text-deep-400">当前位置：太阳</p>
      </div>
    </section>
  );
}
