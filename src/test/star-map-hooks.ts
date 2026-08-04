import type { Camera } from 'three';

import type { Star } from '@/engine';
import { projectToScreen } from '@/engine/renderer/pick-star';
import type { StarMapViewMode, WorldPosition } from '@/engine/renderer/StarMapCameraRig';

export type StarMapHookState = {
  camera: Camera;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  stars: readonly Star[];
  scale: number;
  mode: StarMapViewMode;
  getCameraPosition: () => WorldPosition;
  setAutoRotate: (enabled: boolean) => void;
};

let getState: (() => StarMapHookState) | null = null;

export function installStarMapHooks(state: () => StarMapHookState): void {
  getState = state;
}

export function uninstallStarMapHooks(): void {
  getState = null;
}

export function getStarScreenPosition(starId: string): { clientX: number; clientY: number } | null {
  if (getState == null) return null;
  const state = getState();
  const star = state.stars.find((s) => s.id === starId);
  if (star == null) return null;
  const c = star.coords.cartesian;
  const pos = projectToScreen(
    { x: c.xLy * state.scale, y: c.yLy * state.scale, z: c.zLy * state.scale },
    state.camera,
    state.width,
    state.height,
  );
  if (pos == null) return null;
  const rect = state.canvas.getBoundingClientRect();
  return { clientX: rect.left + pos.x, clientY: rect.top + pos.y };
}

export function setStarMapAutoRotate(enabled: boolean): void {
  if (getState == null) return;
  getState().setAutoRotate(enabled);
}

export function getStarMapViewMode(): StarMapViewMode | null {
  if (getState == null) return null;
  return getState().mode;
}

export function getStarMapCameraPosition(): WorldPosition | null {
  if (getState == null) return null;
  return getState().getCameraPosition();
}
