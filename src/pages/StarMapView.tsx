import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';

import { StarCatalog } from '@/engine';
import { STARS_500_FIXTURE } from '@/engine/data/__fixtures__/stars-500';
import { StarField } from '@/engine/renderer/StarField';

export function StarMapView() {
  const [catalog, setCatalog] = useState<StarCatalog | null>(null);

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

  const { stars, scale } = useMemo(() => {
    if (catalog == null) return { stars: [] as typeof STARS_500_FIXTURE, scale: 0.05 };
    const maxLy = catalog.stats.maxDistanceLy;
    const nextScale = maxLy > 0 ? 45 / maxLy : 0.05;
    const filtered = catalog.allStars.filter((s) => s.id !== 'hip-sol');
    return { stars: filtered, scale: nextScale };
  }, [catalog]);

  return (
    <section data-testid="starmap-view" className="relative h-full w-full flex-1 animate-fade-up">
      <Canvas
        camera={{ position: [0, 0, 55], fov: 50, near: 0.1, far: 500 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        {stars.length > 0 && <StarField stars={stars} scale={scale} />}
        <OrbitControls
          enablePan
          enableZoom
          minDistance={8}
          maxDistance={220}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <p className="glass-card rounded-full px-4 py-1.5 text-xs text-deep-400">
          拖拽旋转 · 滚轮缩放 · {catalog?.size ?? 0} 颗恒星
        </p>
      </div>
    </section>
  );
}
