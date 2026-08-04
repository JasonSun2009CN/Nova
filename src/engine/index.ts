export type * from './physics/lorentz';
export {
  LIGHT_SPEED,
  cruisePlan,
  lorentzFactor,
  requiredFocusMinutes,
  travelDistance,
} from './physics/lorentz';

export type * from './contract/voyage-types';
export { VoyageController, IllegalStateError } from './navigation/VoyageController';

export type * from './contract/catalog-types';
export { CONSTELLATION_IAU_CODES } from './contract/catalog-types';
export {
  equatorialToGalacticCartesian,
  parseSpectral,
  protoToStar,
  type ProtoStar,
} from './data/star-mapper';
export { KdTree3, distanceSq3, distanceLy3 } from './data/KdTree3';
export type { KdPoint3, FindNearestResult as KdFindNearestResult } from './data/KdTree3';
export { StarCatalog } from './data/StarCatalog';
export type { StarFilter } from './data/StarCatalog';
