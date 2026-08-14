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
const MIN_PITCH = -1.35;
const MAX_PITCH = 1.35;

type WorldPosition = Readonly<{ x: number; y: number; z: number }>;

const ORIGIN: WorldPosition = { x: 0, y: 0, z: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function BackgroundCameraRig({
  shipPosition,
  lookTarget,
  joystickRef,
}: {
  shipPosition: WorldPosition | null;
  lookTarget: WorldPosition | null;
  joystickRef: { current: JoystickVector };
}) {
  const camera = useThree((s) => s.camera);
  const stateRef = useRef({ yaw: 0, pitch: 0 });

  useLayoutEffect(() => {
    if (shipPosition != null && lookTarget != null) {
      const dx = lookTarget.x - shipPosition.x;
      const dy = lookTarget.y - shipPosition.y;
      const dz = lookTarget.z - shipPosition.z;
      const len = Math.hypot(dx, dy, dz);
      if (len > 1e-6) {
        stateRef.current = { yaw: Math.atan2(dx, dz), pitch: Math.asin(dy / len) };
        return;
      }
    }
    stateRef.current = { yaw: 0, pitch: 0 };
  }, [shipPosition, lookTarget]);

  useFrame((_, delta) => {
    const ship = shipPosition ?? ORIGIN;
    const state = stateRef.current;
    const joystick = joystickRef.current;
    if (joystick.x !== 0 || joystick.y !== 0) {
      state.yaw -= ROTATE_SPEED * joystick.x * delta;
      state.pitch = clamp(state.pitch - ROTATE_SPEED * joystick.y * delta, MIN_PITCH, MAX_PITCH);
    }
    const cosP = Math.cos(state.pitch);
    const fx = cosP * Math.sin(state.yaw);
    const fy = Math.sin(state.pitch);
    const fz = cosP * Math.cos(state.yaw);
    camera.position.set(ship.x, ship.y, ship.z);
    camera.lookAt(ship.x + fx, ship.y + fy, ship.z + fz);
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

  const departureStar = useMemo(
    () => catalog?.findById(currentStarId) ?? catalog?.findById('hip-sol') ?? null,
    [catalog, currentStarId],
  );
  const destStar = useMemo(
    () => (destStarId != null ? (catalog?.findById(destStarId) ?? null) : null),
    [catalog, destStarId],
  );
  const sunStar = useMemo(
    () => catalog?.allStars.find((s) => s.id === 'hip-sol') ?? null,
    [catalog],
  );

  const { navStars, bgStars } = useMemo(() => {
    if (catalog == null) {
      return { navStars: [] as Star[], bgStars: [] as Star[] };
    }
    const nav: Star[] = [];
    const bg: Star[] = [];
    for (const s of catalog.allStars) {
      if (s.id === 'hip-sol' || s.id === departureStar?.id) continue;
      if (s.properName != null && starDistanceLy(s) <= NAV_MAX_DISTANCE_LY) {
        nav.push(s);
      } else {
        bg.push(s);
      }
    }
    return { navStars: nav, bgStars: bg };
  }, [catalog, departureStar]);

  const departureWorld = useMemo(() => {
    if (departureStar == null) return null;
    const c = departureStar.coords.cartesian;
    return { x: c.xLy * NAV_SCALE, y: c.yLy * NAV_SCALE, z: c.zLy * NAV_SCALE };
  }, [departureStar]);

  const destWorld = useMemo(() => {
    if (destStar == null) return null;
    const c = destStar.coords.cartesian;
    return { x: c.xLy * NAV_SCALE, y: c.yLy * NAV_SCALE, z: c.zLy * NAV_SCALE };
  }, [destStar]);

  const sunRenderStars = useMemo(() => {
    if (sunStar == null || departureStar?.id === 'hip-sol') return [];
    return [{ ...sunStar, apparentMagnitude: SUN_RENDER_MAGNITUDE }];
  }, [sunStar, departureStar]);

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
          {destStar != null && destStar.id !== departureStar?.id && (
            <DestinationMarker star={destStar} scale={NAV_SCALE} />
          )}
          <BackgroundCameraRig
            shipPosition={departureWorld}
            lookTarget={destWorld}
            joystickRef={joystickRef}
          />
        </Canvas>
      </div>
      <div className="absolute right-4 top-1/2 z-20 -translate-y-1/2">
        <CameraJoystick joystickRef={joystickRef} ariaLabel={t('starmap.joystickAria')} />
      </div>
    </div>
  );
}
