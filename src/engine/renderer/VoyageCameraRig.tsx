import { useFrame, useThree } from '@react-three/fiber';

export type Position3 = readonly [number, number, number];

type VoyageCameraRigProps = {
  origin: Position3 | null;
  target: Position3 | null;
  direction: Position3;
  fraction: number;
  advance: number;
};

export function VoyageCameraRig({
  origin,
  target,
  direction,
  fraction,
  advance,
}: VoyageCameraRigProps) {
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    if (origin == null) return;
    if (target != null) {
      const f = Math.max(0, Math.min(0.98, fraction));
      camera.position.set(
        origin[0] + (target[0] - origin[0]) * f,
        origin[1] + (target[1] - origin[1]) * f,
        origin[2] + (target[2] - origin[2]) * f,
      );
      camera.lookAt(target[0], target[1], target[2]);
    } else {
      camera.position.set(
        origin[0] + direction[0] * advance,
        origin[1] + direction[1] * advance,
        origin[2] + direction[2] * advance,
      );
      camera.lookAt(origin[0] + direction[0], origin[1] + direction[1], origin[2] + direction[2]);
    }
  });

  return null;
}
