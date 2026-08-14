import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ElementRef, type RefObject } from 'react';

import { StarInfoCard } from '@/components/StarMap/StarInfoCard';
import { StarSearch } from '@/components/StarMap/StarSearch';
import { starDisplayName, starDistanceLy } from '@/data/destination-stars';
import { StarCatalog, type Star } from '@/engine';
import { useI18n } from '@/i18n';
import { FollowStarBridge } from '@/engine/renderer/FollowStarBridge';
import { CurrentPositionMarker, DestinationMarker } from '@/engine/renderer/MapMarkers';
import { NebulaField } from '@/engine/renderer/NebulaField';
import { PickController } from '@/engine/renderer/PickController';
import { RadiusGuides } from '@/engine/renderer/RadiusGuides';
import { StarMapCameraRig, type StarMapViewMode } from '@/engine/renderer/StarMapCameraRig';
import { StarField } from '@/engine/renderer/StarField';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoyageStore } from '@/store/useVoyageStore';
import { installStarMapHooks, uninstallStarMapHooks } from '@/test/star-map-hooks';

type OrbitControlsHandle = ElementRef<typeof OrbitControls>;

const NAV_MAX_DISTANCE_LY = 100;
const NAV_SCALE = 45 / NAV_MAX_DISTANCE_LY;
const SUN_RENDER_MAGNITUDE = 1.5;
const SUN_SIZE_SCALE = 2.4;
const RADIUS_GUIDES_LY = [10, 25, 50];

function StarMapHookBridge({
  stars,
  scale,
  controlsRef,
  mode,
}: {
  stars: readonly Star[];
  scale: number;
  controlsRef: RefObject<OrbitControlsHandle | null>;
  mode: StarMapViewMode;
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
      mode,
      getCameraPosition: () => {
        const p = camera.position;
        return { x: p.x, y: p.y, z: p.z };
      },
      setAutoRotate: (enabled: boolean) => {
        const controls = controlsRef.current;
        if (controls != null) controls.autoRotate = enabled;
      },
    }));
    return () => {
      uninstallStarMapHooks();
    };
  }, [camera, gl, width, height, stars, scale, controlsRef, mode]);

  return null;
}

export function StarMapView({ onClose }: { onClose?: () => void }) {
  const { t, lang } = useI18n();
  const [catalog, setCatalog] = useState<StarCatalog | null>(null);
  const [selected, setSelected] = useState<Star | null>(null);
  const [mode, setMode] = useState<StarMapViewMode>('from-departure');
  const destStarId = useVoyageStore((s) => s.destStarId);
  const catalogStars = useCatalogStore((s) => s.stars);
  const catalogNebulae = useCatalogStore((s) => s.nebulae);
  const catalogStatus = useCatalogStore((s) => s.status);
  const currentStarId = useSettingsStore((s) => s.settings.currentStarId) ?? 'hip-sol';
  const isLargeScreen = useMediaQuery('(min-width: 768px)');
  const controlsRef = useRef<OrbitControlsHandle | null>(null);
  const followRef = useRef<HTMLDivElement | null>(null);

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

  const departureName =
    departureStar != null ? starDisplayName(departureStar, lang) : lang === 'en' ? 'Sun' : '太阳';

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
          camera={{ position: [0, 0.5, 1.1], fov: 50, near: 0.1, far: 500 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
        >
          <StarField stars={bgStars} scale={NAV_SCALE} />
          <StarField stars={sunRenderStars} scale={NAV_SCALE} sizeScale={SUN_SIZE_SCALE} />
          <StarField stars={navStars} scale={NAV_SCALE} />
          <NebulaField nebulae={catalog?.nebulae() ?? []} />
          {mode === 'overview' && <RadiusGuides scale={NAV_SCALE} radiiLy={RADIUS_GUIDES_LY} />}
          {mode === 'overview' && departureWorld != null && (
            <CurrentPositionMarker
              position={[departureWorld.x, departureWorld.y, departureWorld.z]}
            />
          )}
          {destStar != null && <DestinationMarker star={destStar} scale={NAV_SCALE} />}
          <PickController stars={pickableStars} scale={NAV_SCALE} onPick={handlePick} />
          <FollowStarBridge star={selected} scale={NAV_SCALE} targetRef={followRef} />
          <StarMapCameraRig mode={mode} focusPosition={departureWorld} controlsRef={controlsRef} />
          <StarMapHookBridge
            stars={navStars}
            scale={NAV_SCALE}
            controlsRef={controlsRef}
            mode={mode}
          />
          <OrbitControls
            ref={controlsRef}
            enableZoom
            enableDamping
            enablePan={false}
            autoRotate={false}
            autoRotateSpeed={0.4}
            minDistance={0.3}
            maxDistance={16}
          />
        </Canvas>
      </div>

      <div className="absolute left-1/2 top-6 z-20 -translate-x-1/2">
        <StarSearch stars={pickableStars} status={catalogStatus} onSelect={handlePick} />
      </div>

      <div data-testid="view-toggle" className="absolute left-4 top-1/2 z-10 -translate-y-1/2">
        <div className="glass-card flex flex-col gap-1 rounded-2xl p-1.5">
          <button
            type="button"
            data-testid="view-toggle-from-departure"
            aria-pressed={mode === 'from-departure'}
            onClick={() => setMode('from-departure')}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl px-2.5 py-2 transition-colors ${
              mode === 'from-departure'
                ? 'bg-white/10 text-foreground'
                : 'text-deep-400 hover:text-foreground'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
              <circle cx="12" cy="12" r="2.6" />
            </svg>
            <span className="text-[0.625rem]">{t('starmap.viewFromDeparture')}</span>
          </button>
          <button
            type="button"
            data-testid="view-toggle-overview"
            aria-pressed={mode === 'overview'}
            onClick={() => setMode('overview')}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl px-2.5 py-2 transition-colors ${
              mode === 'overview'
                ? 'bg-white/10 text-foreground'
                : 'text-deep-400 hover:text-foreground'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="8" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
            <span className="text-[0.625rem]">{t('starmap.viewOverview')}</span>
          </button>
        </div>
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

      {mode === 'overview' && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2">
          <p className="glass-card rounded-full px-4 py-1.5 text-xs text-deep-400">
            {t('starmap.radiusGuides', { radii: RADIUS_GUIDES_LY.join(' / ') })}
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <p className="glass-card rounded-full px-4 py-1.5 text-xs text-deep-400">
          {mode === 'overview' ? t('starmap.hintRotate') : t('starmap.hintLook')} ·{' '}
          {t('starmap.hintClick')} ·{' '}
          <span data-testid="star-count">
            {catalogStatus === 'loading'
              ? t('starmap.loadingCatalog')
              : catalogStatus === 'error'
                ? t('starmap.catalogError')
                : t('starmap.starCount', { count: catalog?.size ?? 0 })}
          </span>
        </p>
      </div>

      <div className="pointer-events-none absolute right-6 top-6 z-10">
        <p className="glass-card rounded-full px-4 py-1.5 text-xs text-deep-400">
          {t(mode === 'overview' ? 'starmap.currentPosition' : 'starmap.originStar')}：
          {departureName}
        </p>
      </div>
    </section>
  );
}
