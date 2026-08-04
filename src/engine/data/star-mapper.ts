import type { Cartesian3, CatalogTier, Star } from '@/engine/contract/catalog-types';

export type ProtoStar = {
  id: string;
  properName?: string;
  bayer?: string;
  flamsteed?: string;
  constellation?: string;
  raDeg: number;
  decDeg: number;
  distanceLy: number;
  vMag: number;
  absMag?: number;
  spectral: string;
  luminositySol?: number;
  temperatureK?: number;
  tier?: CatalogTier;
};

export function parseSpectral(spec: string): Star['spectral'] {
  const t = spec[0] ?? '?';
  const type =
    t === 'W' ||
    t === 'O' ||
    t === 'B' ||
    t === 'A' ||
    t === 'F' ||
    t === 'G' ||
    t === 'K' ||
    t === 'M' ||
    t === 'L' ||
    t === 'T'
      ? (t as Star['spectral']['type'])
      : '?';
  const typeStarMatch = /^(\w)\s*(\d{0,2}(?:\.\d)?)/.exec(spec);
  const subStr = typeStarMatch?.[2];
  const subclass = subStr != null && subStr.length > 0 ? Number(subStr) : undefined;
  const lumMatch = /(Ia0|Iab|Ia|II|III|IV|V|VI|VII|Ib|Iab)/.exec(spec);
  const luminosityClass = (lumMatch?.[1] as Star['spectral']['luminosityClass']) ?? undefined;
  return { type, subclass, luminosityClass };
}

export function equatorialToGalacticCartesian(
  raDeg: number,
  decDeg: number,
  distanceLy: number,
): { galactic: { lDeg: number; bDeg: number; distanceLy: number }; cartesian: Cartesian3 } {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const raNGP = 192.859 * (Math.PI / 180);
  const decNGP = 27.128 * (Math.PI / 180);
  const lCP = 122.932 * (Math.PI / 180);
  const sinDecNGP = Math.sin(decNGP);
  const cosDecNGP = Math.cos(decNGP);
  const cosDRa0 = Math.cos(dec) * Math.cos(ra - raNGP);
  const b = Math.asin(sinDecNGP * Math.sin(dec) + cosDecNGP * cosDRa0);
  const lCos = (cosDecNGP * Math.sin(dec) - sinDecNGP * cosDRa0) / Math.cos(b);
  const lSin = (Math.cos(dec) * Math.sin(ra - raNGP)) / Math.cos(b);
  let l = lCP - Math.atan2(lSin, lCos);
  if (l < 0) l += 2 * Math.PI;
  if (l >= 2 * Math.PI) l -= 2 * Math.PI;
  const lDeg = (l * 180) / Math.PI;
  const bDeg = (b * 180) / Math.PI;
  const cosb = Math.cos(b);
  const gx = distanceLy * cosb * Math.cos(l);
  const gy = distanceLy * cosb * Math.sin(l);
  const gz = distanceLy * Math.sin(b);
  return {
    galactic: { lDeg, bDeg, distanceLy },
    cartesian: { xLy: gx, yLy: gy, zLy: gz },
  };
}

export function protoToStar(p: ProtoStar): Star {
  const celestial = equatorialToGalacticCartesian(p.raDeg, p.decDeg, p.distanceLy);
  const iau = (p.constellation as Star['constellationIau']) ?? undefined;
  const absMag = p.absMag ?? null;
  const hipMatch = /^hip(?:-fake)?-(\d+)$/.exec(p.id);
  const hipId = hipMatch != null ? Number(hipMatch[1]) : undefined;
  return {
    id: p.id,
    hipId,
    properName: p.properName,
    bayerName: p.bayer ?? undefined,
    flamsteedName: p.flamsteed ?? undefined,
    constellationIau: iau,
    coords: {
      equatorial: {
        raDeg: p.raDeg,
        decDeg: p.decDeg,
        parallaxMas: p.distanceLy > 0 ? 1000 / (p.distanceLy / 3.261_566_6) : null,
      },
      galactic: celestial.galactic,
      cartesian: celestial.cartesian,
    },
    spectral: parseSpectral(p.spectral),
    apparentMagnitude: p.vMag,
    absoluteMagnitude: absMag,
    luminositySol: p.luminositySol,
    temperatureKelvin: p.temperatureK,
    catalogTier: p.tier ?? 'tier2-bright-mag6',
  };
}
