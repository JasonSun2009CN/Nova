import type { Cartesian3, Star } from '@/engine/contract/catalog-types';

type ProtoStar = {
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
  tier?: 'tier0-solar' | 'tier1-nearby-100ly' | 'tier2-bright-mag6' | 'tier3-gaia-million';
};

const SOLAR_PROTO: ProtoStar = {
  id: 'hip-sol',
  properName: '太阳',
  raDeg: 0,
  decDeg: 0,
  distanceLy: 0,
  vMag: -26.74,
  absMag: 4.83,
  spectral: 'G2V',
  luminositySol: 1,
  temperatureK: 5778,
  tier: 'tier0-solar',
};

const NEARBY_PROTOS: ProtoStar[] = [
  {
    id: 'hip-71681',
    properName: '半人马座 α A',
    bayer: 'α',
    flamsteed: null as unknown as string,
    constellation: 'CEN',
    raDeg: 219.9021,
    decDeg: -60.8339,
    distanceLy: 4.36,
    vMag: -0.01,
    absMag: 4.38,
    spectral: 'G2V',
    luminositySol: 1.519,
    temperatureK: 5790,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-71682',
    properName: '半人马座 α B (Toliman)',
    bayer: 'α',
    flamsteed: null as unknown as string,
    constellation: 'CEN',
    raDeg: 219.9022,
    decDeg: -60.8339,
    distanceLy: 4.36,
    vMag: 1.34,
    absMag: 5.72,
    spectral: 'K1V',
    luminositySol: 0.5,
    temperatureK: 5260,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-70890',
    properName: '比邻星 Proxima Centauri',
    bayer: null as unknown as string,
    flamsteed: null as unknown as string,
    constellation: 'CEN',
    raDeg: 217.428,
    decDeg: -62.6795,
    distanceLy: 4.246,
    vMag: 11.13,
    absMag: 15.53,
    spectral: 'M5.5Ve',
    luminositySol: 0.0017,
    temperatureK: 3042,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-32349',
    properName: '巴纳德星',
    bayer: null as unknown as string,
    flamsteed: null as unknown as string,
    constellation: 'OPH',
    raDeg: 269.452,
    decDeg: 4.693,
    distanceLy: 5.963,
    vMag: 9.54,
    absMag: 13.24,
    spectral: 'M4.0V',
    luminositySol: 0.0035,
    temperatureK: 3134,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-24608',
    properName: '沃尔夫 359',
    bayer: null as unknown as string,
    flamsteed: null as unknown as string,
    constellation: 'LEO',
    raDeg: 164.12,
    decDeg: 7.015,
    distanceLy: 7.9,
    vMag: 13.54,
    absMag: 16.56,
    spectral: 'M6.5V',
    luminositySol: 0.00075,
    temperatureK: 2800,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-3829',
    properName: '拉兰德 21185',
    bayer: null as unknown as string,
    flamsteed: null as unknown as string,
    constellation: 'UMA',
    raDeg: 165.83,
    decDeg: 35.972,
    distanceLy: 8.307,
    vMag: 7.47,
    absMag: 10.44,
    spectral: 'M2V',
    luminositySol: 0.013,
    temperatureK: 3480,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-1475',
    properName: '天狼星 A',
    bayer: 'α',
    flamsteed: '9',
    constellation: 'CMA',
    raDeg: 101.287,
    decDeg: -16.716,
    distanceLy: 8.6,
    vMag: -1.46,
    absMag: 1.42,
    spectral: 'A1V',
    luminositySol: 25.4,
    temperatureK: 9940,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-37826',
    properName: '鲸鱼座 τ (天仓五)',
    bayer: 'τ',
    flamsteed: '52',
    constellation: 'CET',
    raDeg: 26.017,
    decDeg: -15.937,
    distanceLy: 11.91,
    vMag: 3.49,
    absMag: 5.68,
    spectral: 'G8.5V',
    luminositySol: 0.52,
    temperatureK: 5344,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-27989',
    properName: '南河三 (小犬座 α Procyon)',
    bayer: 'α',
    flamsteed: '10',
    constellation: 'CMI',
    raDeg: 114.825,
    decDeg: 5.225,
    distanceLy: 11.46,
    vMag: 0.34,
    absMag: 2.68,
    spectral: 'F5IV-V',
    luminositySol: 6.94,
    temperatureK: 6530,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-102098',
    properName: '织女一 (天琴座 α Vega)',
    bayer: 'α',
    flamsteed: '3',
    constellation: 'LYR',
    raDeg: 279.234,
    decDeg: 38.784,
    distanceLy: 25.04,
    vMag: 0.02,
    absMag: 0.58,
    spectral: 'A0Va',
    luminositySol: 40.12,
    temperatureK: 9602,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-113963',
    properName: '河鼓二 / 牛郎星',
    bayer: 'α',
    flamsteed: '53',
    constellation: 'AQL',
    raDeg: 297.696,
    decDeg: 8.868,
    distanceLy: 16.73,
    vMag: 0.76,
    absMag: 2.21,
    spectral: 'A7V',
    luminositySol: 10.6,
    temperatureK: 7700,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-10826',
    properName: '水委一 (波江座 α)',
    bayer: 'α',
    flamsteed: '30',
    constellation: 'ERI',
    raDeg: 24.441,
    decDeg: -57.237,
    distanceLy: 139,
    vMag: 0.42,
    absMag: -2.69,
    spectral: 'B3V',
    luminositySol: 3150,
    temperatureK: 14920,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-60718',
    properName: '参宿四 (猎户座 α)',
    bayer: 'α',
    flamsteed: '58',
    constellation: 'ORI',
    raDeg: 88.793,
    decDeg: 7.407,
    distanceLy: 700,
    vMag: 0.45,
    absMag: -5.87,
    spectral: 'M1-2Ia-Iab',
    luminositySol: 126_000,
    temperatureK: 3548,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-37279',
    properName: '毕宿五 (金牛座 α Aldebaran)',
    bayer: 'α',
    flamsteed: '87',
    constellation: 'TAU',
    raDeg: 68.98,
    decDeg: 16.509,
    distanceLy: 65.3,
    vMag: 0.85,
    absMag: -0.64,
    spectral: 'K5+III',
    luminositySol: 425,
    temperatureK: 3910,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-27366',
    properName: '北河三 (双子座 β Pollux)',
    bayer: 'β',
    flamsteed: '78',
    constellation: 'GEM',
    raDeg: 116.329,
    decDeg: 28.026,
    distanceLy: 33.72,
    vMag: 1.14,
    absMag: 1.09,
    spectral: 'K0III',
    luminositySol: 37.7,
    temperatureK: 4666,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-91262',
    properName: '北落师门 (南鱼座 α)',
    bayer: 'α',
    flamsteed: '24',
    constellation: 'PSA',
    raDeg: 344.412,
    decDeg: -29.622,
    distanceLy: 25.13,
    vMag: 1.16,
    absMag: 1.72,
    spectral: 'A3V',
    luminositySol: 16.6,
    temperatureK: 8590,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-85927',
    properName: '心宿二 (天蝎座 α)',
    bayer: 'α',
    flamsteed: '21',
    constellation: 'SCO',
    raDeg: 247.352,
    decDeg: -26.432,
    distanceLy: 550,
    vMag: 0.96,
    absMag: -5.28,
    spectral: 'M1.5Iab',
    luminositySol: 75900,
    temperatureK: 3660,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-49669',
    properName: '角宿一 (室女座 α)',
    bayer: 'α',
    flamsteed: '67',
    constellation: 'VIR',
    raDeg: 201.298,
    decDeg: -11.161,
    distanceLy: 250,
    vMag: 0.97,
    absMag: -3.45,
    spectral: 'B1V',
    luminositySol: 12100,
    temperatureK: 23000,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-65474',
    properName: '轩辕十四 (狮子座 α)',
    bayer: 'α',
    flamsteed: '32',
    constellation: 'LEO',
    raDeg: 152.093,
    decDeg: 11.967,
    distanceLy: 79.3,
    vMag: 1.4,
    absMag: -0.58,
    spectral: 'B7V',
    luminositySol: 150,
    temperatureK: 12460,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-4472',
    properName: '五车二 (御夫座 α)',
    bayer: 'α',
    flamsteed: '13',
    constellation: 'AUR',
    raDeg: 79.172,
    decDeg: 45.998,
    distanceLy: 42.9,
    vMag: 0.07,
    absMag: -0.52,
    spectral: 'G8III+G0III',
    luminositySol: 78.7,
    temperatureK: 4940,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-9884',
    properName: '参宿七 (猎户座 β)',
    bayer: 'β',
    flamsteed: '19',
    constellation: 'ORI',
    raDeg: 78.634,
    decDeg: -8.202,
    distanceLy: 860,
    vMag: 0.13,
    absMag: -7.85,
    spectral: 'B8Ia',
    luminositySol: 123000,
    temperatureK: 12100,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-54061',
    properName: '北斗七星-天玑 (大熊座 γ)',
    bayer: 'γ',
    flamsteed: '64',
    constellation: 'UMA',
    raDeg: 137.662,
    decDeg: 53.695,
    distanceLy: 83.7,
    vMag: 2.41,
    absMag: 0.28,
    spectral: 'A0V',
    luminositySol: 65,
    temperatureK: 9800,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-53910',
    properName: '北斗七星-天枢 (大熊座 α Dubhe)',
    bayer: 'α',
    flamsteed: '54',
    constellation: 'UMA',
    raDeg: 165.933,
    decDeg: 61.751,
    distanceLy: 124,
    vMag: 1.79,
    absMag: -1.11,
    spectral: 'K0III',
    luminositySol: 266,
    temperatureK: 4660,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-45556',
    properName: '五帝座一 (狮子座 β)',
    bayer: 'β',
    flamsteed: '94',
    constellation: 'LEO',
    raDeg: 176.456,
    decDeg: 20.524,
    distanceLy: 36,
    vMag: 2.14,
    absMag: 1.93,
    spectral: 'A3V',
    luminositySol: 10.5,
    temperatureK: 8669,
    tier: 'tier1-nearby-100ly',
  },
  {
    id: 'hip-57632',
    properName: '贯索四 (北冕座 α)',
    bayer: 'α',
    flamsteed: '5',
    constellation: 'CRA',
    raDeg: 233.224,
    decDeg: 39.72,
    distanceLy: 74,
    vMag: 2.23,
    absMag: 0.43,
    spectral: 'A0V',
    luminositySol: 65,
    temperatureK: 9400,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-37084',
    properName: '五车五 (御夫座 β / 金牛座 γ)',
    bayer: 'β',
    flamsteed: '112',
    constellation: 'TAU',
    raDeg: 81.283,
    decDeg: 28.604,
    distanceLy: 131,
    vMag: 1.65,
    absMag: -0.88,
    spectral: 'B7III',
    luminositySol: 680,
    temperatureK: 13820,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-68702',
    properName: '北斗七星-玉衡 (大熊座 ε Alioth)',
    bayer: 'ε',
    flamsteed: '77',
    constellation: 'UMA',
    raDeg: 193.507,
    decDeg: 55.959,
    distanceLy: 82.6,
    vMag: 1.76,
    absMag: -0.22,
    spectral: 'A0p',
    luminositySol: 102,
    temperatureK: 9020,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-62956',
    properName: '开阳 (大熊座 ζ)',
    bayer: 'ζ',
    flamsteed: '79',
    constellation: 'UMA',
    raDeg: 203.476,
    decDeg: 54.925,
    distanceLy: 78.2,
    vMag: 2.22,
    absMag: 0.32,
    spectral: 'A1V',
    luminositySol: 33.3,
    temperatureK: 8940,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-46853',
    properName: '摇光 (大熊座 η)',
    bayer: 'η',
    flamsteed: '85',
    constellation: 'UMA',
    raDeg: 206.885,
    decDeg: 49.313,
    distanceLy: 101,
    vMag: 1.85,
    absMag: -0.66,
    spectral: 'B3V',
    luminositySol: 480,
    temperatureK: 15540,
    tier: 'tier2-bright-mag6',
  },
  {
    id: 'hip-80763',
    properName: '贯索增六 / 大角星 (牧夫座 α)',
    bayer: 'α',
    flamsteed: '16',
    constellation: 'BOO',
    raDeg: 213.915,
    decDeg: 19.182,
    distanceLy: 36.7,
    vMag: -0.05,
    absMag: -0.31,
    spectral: 'K1.5III',
    luminositySol: 170,
    temperatureK: 4286,
    tier: 'tier1-nearby-100ly',
  },
];

function parseSpectral(spec: string): Star['spectral'] {
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

function equatorialToGalacticCartesian(
  raDeg: number,
  decDeg: number,
  distanceLy: number,
): { galactic: { lDeg: number; bDeg: number; distanceLy: number }; cartesian: Cartesian3 } {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const raGP = ((12 + 49 / 60) / 24) * 360 * (Math.PI / 180);
  const decGP = (27 + 24 / 60) * (Math.PI / 180);
  const lCP = 123 * (Math.PI / 180);
  const sindGP = Math.sin(decGP);
  const cosdGP = Math.cos(decGP);
  const cosDRa0 = Math.cos(dec) * Math.cos(ra - raGP);
  const b = Math.asin(sindGP * Math.sin(dec) + cosdGP * cosDRa0);
  const lCos = (sindGP * cosDRa0 - Math.cos(decGP) * Math.sin(dec)) / Math.cos(b);
  const lSin = (Math.cos(dec) * Math.sin(ra - raGP)) / Math.cos(b);
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

function protoToStar(p: ProtoStar): Star {
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

function seed(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildBrightStarsFixtures(): Star[] {
  const stars: Star[] = [protoToStar(SOLAR_PROTO)];
  for (const p of NEARBY_PROTOS) stars.push(protoToStar(p));
  const tierMix: Star['catalogTier'][] = [
    'tier1-nearby-100ly',
    'tier1-nearby-100ly',
    'tier2-bright-mag6',
    'tier2-bright-mag6',
    'tier2-bright-mag6',
    'tier3-gaia-million',
  ];
  const maxIndex = Math.max(stars.length, 1);
  const total = 500;
  for (let i = 0; i < total - maxIndex; i++) {
    const id = `hip-fake-${1_000_000 + i}`;
    const u1 = seed(i + 7);
    const u2 = seed(i + 29);
    const u3 = seed(i + 53);
    const u4 = seed(i + 71);
    const u5 = seed(i + 97);
    const l = u1 * 2 * Math.PI;
    const b = Math.acos(2 * u2 - 1) - Math.PI / 2;
    const tier = tierMix[Math.floor(u3 * tierMix.length)]!;
    const distBase =
      tier === 'tier1-nearby-100ly'
        ? 70 + u4 * 30
        : tier === 'tier2-bright-mag6'
          ? 100 + u4 * 1900
          : 2000 + u4 * 8000;
    const cosb = Math.cos(b);
    const gx = distBase * cosb * Math.cos(l);
    const gy = distBase * cosb * Math.sin(l);
    const gz = distBase * Math.sin(b);
    const specType =
      u5 < 0.02
        ? 'O'
        : u5 < 0.08
          ? 'B'
          : u5 < 0.25
            ? 'A'
            : u5 < 0.45
              ? 'F'
              : u5 < 0.7
                ? 'G'
                : u5 < 0.88
                  ? 'K'
                  : 'M';
    const subClass = Math.round(seed(i + 121) * 9);
    const appMag =
      tier === 'tier1-nearby-100ly'
        ? 2 + seed(i + 131) * 7
        : tier === 'tier2-bright-mag6'
          ? -1.5 + seed(i + 141) * 7.5
          : 7 + seed(i + 161) * 14;
    const absMag = appMag - 5 * Math.log10(Math.max(distBase / 10, 0.0001));
    stars.push({
      id,
      coords: {
        equatorial: {
          raDeg: (u1 * 360 + u2 * 1e-6) % 360,
          decDeg: (b * 180) / Math.PI,
          parallaxMas: distBase > 0 ? 1000 / (distBase / 3.261_566_6) : null,
        },
        galactic: { lDeg: (l * 180) / Math.PI, bDeg: (b * 180) / Math.PI, distanceLy: distBase },
        cartesian: { xLy: gx, yLy: gy, zLy: gz },
      },
      spectral: {
        type: specType,
        subclass: subClass,
        luminosityClass: u4 > 0.6 ? 'V' : u4 > 0.3 ? 'III' : undefined,
      },
      apparentMagnitude: appMag,
      absoluteMagnitude: absMag,
      catalogTier: tier,
    });
  }
  return stars;
}

export const STARS_500_FIXTURE: Star[] = Object.freeze(
  buildBrightStarsFixtures(),
) as unknown as Star[];
