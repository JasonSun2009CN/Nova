import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { CameraJoystick, type JoystickVector } from '@/components/CameraJoystick';
import { starDistanceLy } from '@/data/destination-stars';
import { StarCatalog, type Star } from '@/engine';
import { DestinationMarker } from '@/engine/renderer/MapMarkers';
import { NebulaField } from '@/engine/renderer/NebulaField';
import { StarField } from '@/engine/renderer/StarField';
import { useI18n } from '@/i18n';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoyageStore } from '@/store/useVoyageStore';

const NAV_MAX_DISTANCE_LY = 100;
const NAV_SCALE = 45 / NAV_MAX_DISTANCE_LY;
const SUN_RENDER_MAGNITUDE = 1.5;
const SUN_SIZE_SCALE = 2.4;
const ROTATE_SPEED = 2.2;
const MIN_PHI = 0.15;
const MAX_PHI = Math.PI - 0.15;
const CAMERA_OFFSET_LEN = Math.hypot(0, 0.5, 1.1);
const CAMERA_OFFSET_PHI = Math.acos(0.5 / CAMERA_OFFSET_LEN);

type WorldPosition = Readonly<{ x: number; y: number; z: number }>;

const ORIGIN: WorldPosition = { x: 0, y: 0, z: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function BackgroundCameraRig({
  focusPosition,
  joystickRef,
}: {
  focusPosition: WorldPosition | null;
  joystickRef: { current: JoystickVector };
}) {
  const camera = useThree((s) => s.camera);
  const stateRef = useRef({ theta: 0, phi: CAMERA_OFFSET_PHI, radius: CAMERA_OFFSET_LEN });

  useLayoutEffect(() => {
    stateRef.current = { theta: 0, phi: CAMERA_OFFSET_PHI, radius: CAMERA_OFFSET_LEN };
  }, [focusPosition]);

  useFrame((_, delta) => {
    const target = focusPosition ?? ORIGIN;
    const state = stateRef.current;
    const joystick = joystickRef.current;
    if (joystick.x !== 0 || joystick.y !== 0) {
      state.theta -= ROTATE_SPEED * joystick.x * delta;
      state.phi = clamp(state.phi + ROTATE_SPEED * joystick.y * delta, MIN_PHI, MAX_PHI);
    }
    const sinPhi = Math.sin(state.phi);
    camera.position.set(
      target.x + state.radius * sinPhi * Math.sin(state.theta),
      target.y + state.radius * Math.cos(state.phi),
      target.z + state.radius * sinPhi * Math.cos(state.theta),
    );
    camera.lookAt(target.x, target.y, target.z);
  });

  return null;
}

export function StarMapBackground() {
  const { t } = useI18n();
  const [catalog, setCatalog] = useState<StarCatalog | null>(null);
  const destStarId = useVoyageStore((s) => s.destStarId);
  const catalogStars = useCatalogStore((s) => s.stars);
  const catalogNebulae = useCatalogStore((s) => s.nebulae);
  const currentStarId = useSettingsStore((s) => s.settings.currentStarId) ?? 'hip-sol';
  const joystickRef = useRef<JoystickVector>({ x: 0, y: 0 });

  useEffect(() => {
    void useCatalogStore.getState().load();
  }, []);

  useEffect(() => {
    if (catalogStars.length === 0) return;
    let active = true;
    const catalogInstance = new StarCatalog();
    void catalogInstance.load(catalogStars, { nebulae: catalogNebulae }).then(() => {
      if (active) setCatalog(catalogInstance);
    });
    return () => {
      active = false;
    };
  }, [catalogStars, catalogNebulae]);

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

  const departureStar = useMemo(
    () => catalog?.findById(currentStarId) ?? catalog?.findById('hip-sol') ?? null,
    [catalog, currentStarId],
  );

  const departureWorld = useMemo(() => {
    if (departureStar == null) return null;
    const c = departureStar.coords.cartesian;
    return { x: c.xLy * NAV_SCALE, y: c.yLy * NAV_SCALE, z: c.zLy * NAV_SCALE };
  }, [departureStar]);

  const sunRenderStars = useMemo(
    () => (sunStar == null ? [] : [{ ...sunStar, apparentMagnitude: SUN_RENDER_MAGNITUDE }]),
    [sunStar],
  );

  return (
    <div data-testid="starmap-background" className="absolute inset-0">
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0.5, 1.1], fov: 50, near: 0.1, far: 500 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
        >
          <StarField stars={bgStars} scale={NAV_SCALE} />
          <StarField stars={sunRenderStars} scale={NAV_SCALE} sizeScale={SUN_SIZE_SCALE} />
          <StarField stars={navStars} scale={NAV_SCALE} />
          <NebulaField nebulae={catalog?.nebulae() ?? []} />
          {destStar != null && <DestinationMarker star={destStar} scale={NAV_SCALE} />}
          <BackgroundCameraRig focusPosition={departureWorld} joystickRef={joystickRef} />
        </Canvas>
      </div>
      <div className="absolute right-4 top-1/2 z-20 -translate-y-1/2">
        <CameraJoystick joystickRef={joystickRef} ariaLabel={t('starmap.joystickAria')} />
      </div>
    </div>
  );
}
