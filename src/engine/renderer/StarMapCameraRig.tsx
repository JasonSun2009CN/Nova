import type { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useLayoutEffect, type ElementRef, type RefObject } from 'react';

export type StarMapViewMode = 'from-departure' | 'overview';

export type WorldPosition = Readonly<{ x: number; y: number; z: number }>;

type Position3 = [number, number, number];

const OVERVIEW_CAMERA_POSITION: Position3 = [0, 20, 80];
const FROM_DEPARTURE_OFFSET: Position3 = [0, 0.5, 1.1];
const ORIGIN: WorldPosition = { x: 0, y: 0, z: 0 };

type StarMapCameraRigProps = {
  mode: StarMapViewMode;
  focusPosition: WorldPosition | null;
  controlsRef: RefObject<ElementRef<typeof OrbitControls> | null>;
};

/**
 * 依据视角模式放置相机与 OrbitControls：
 * - overview（上帝视角）：远离太阳系全貌，太阳居中，可平移/自动旋转。
 * - from-departure（出发地视角）：相机站在当前位置（出发地）恒星的近旁，
 *   以该星为枢轴环视四周星空（拖拽即转头）。
 */
export function StarMapCameraRig({ mode, focusPosition, controlsRef }: StarMapCameraRigProps) {
  const camera = useThree((s) => s.camera);

  // useLayoutEffect：在首帧绘制前摆好相机，避免首帧用默认朝向闪一下；
  // 出发地视角显式关闭 autoRotate / pan，防止从全览视角切回时残留绕转状态。
  useLayoutEffect(() => {
    const controls = controlsRef.current;
    if (controls == null) return;

    if (mode === 'overview') {
      controls.target.set(0, 0, 0);
      camera.position.set(...OVERVIEW_CAMERA_POSITION);
      controls.autoRotate = true;
      controls.enablePan = true;
      controls.minDistance = 8;
      controls.maxDistance = 260;
    } else {
      const p = focusPosition ?? ORIGIN;
      controls.target.set(p.x, p.y, p.z);
      camera.position.set(
        p.x + FROM_DEPARTURE_OFFSET[0],
        p.y + FROM_DEPARTURE_OFFSET[1],
        p.z + FROM_DEPARTURE_OFFSET[2],
      );
      controls.autoRotate = false;
      controls.enablePan = false;
      controls.minDistance = 0.3;
      controls.maxDistance = 16;
    }
    controls.update();
  }, [mode, focusPosition, camera, controlsRef]);

  return null;
}
