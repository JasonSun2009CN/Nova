export type SpectralType =
  | 'O'
  | 'B'
  | 'A'
  | 'F'
  | 'G'
  | 'K'
  | 'M'
  | 'L'
  | 'T'
  | 'W'
  | 'WN'
  | 'WC'
  | '?';

export type SpectralClass = Readonly<{
  type: SpectralType;
  subclass?: number;
  luminosityClass?: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII';
}>;

export type EquatorialCoords = Readonly<{
  raDeg: number;
  decDeg: number;
  parallaxMas: number | null;
}>;

export type GalacticCoords = Readonly<{
  lDeg: number;
  bDeg: number;
  distanceLy: number;
}>;

export type Cartesian3 = Readonly<{
  xLy: number;
  yLy: number;
  zLy: number;
}>;

export type Star = Readonly<{
  id: string;
  hipId?: number;
  gaiaId?: string;
  hdId?: number;
  properName?: string;
  bayerName?: string;
  flamsteedName?: string;
  constellationIau?: ConstellationIauCode;
  coords: {
    equatorial: EquatorialCoords;
    galactic: GalacticCoords;
    cartesian: Cartesian3;
  };
  spectral: SpectralClass;
  apparentMagnitude: number;
  absoluteMagnitude: number | null;
  luminositySol?: number;
  temperatureKelvin?: number;
  radiusSol?: number;
  massSol?: number;
  bvColorIndex?: number;
  variabilityType?: string;
  isMultiple?: boolean;
  companionIds?: readonly string[];
  catalogTier: CatalogTier;
}>;

export type CatalogTier =
  | 'tier0-solar'
  | 'tier1-nearby-100ly'
  | 'tier2-bright-mag6'
  | 'tier3-gaia-million';

export const CONSTELLATION_IAU_CODES = [
  'AND',
  'ANT',
  'APS',
  'AQR',
  'AQL',
  'ARA',
  'ARI',
  'AUR',
  'BOO',
  'CAE',
  'CAM',
  'CNC',
  'CVN',
  'CMA',
  'CMI',
  'CAP',
  'CAR',
  'CAS',
  'CEN',
  'CEP',
  'CET',
  'CHA',
  'CIR',
  'COL',
  'COM',
  'CRA',
  'CRB',
  'CRV',
  'CRT',
  'CRU',
  'CYG',
  'DEL',
  'DOR',
  'DRA',
  'EQU',
  'ERI',
  'FOR',
  'GEM',
  'GRU',
  'HER',
  'HOR',
  'HYA',
  'HYI',
  'IND',
  'LAC',
  'LEO',
  'LMI',
  'LEP',
  'LIB',
  'LUP',
  'LYN',
  'LYR',
  'MEN',
  'MIC',
  'MON',
  'MUS',
  'NOR',
  'OCT',
  'OPH',
  'ORI',
  'PAV',
  'PEG',
  'PER',
  'PHE',
  'PIC',
  'PSC',
  'PSA',
  'PUP',
  'PYX',
  'RET',
  'SGE',
  'SGR',
  'PSA_S',
  'SCO',
  'SCL',
  'SCT',
  'SER',
  'SEX',
  'TAU',
  'TEL',
  'TRI',
  'TRA',
  'TUC',
  'UMA',
  'UMI',
  'VEL',
  'VIR',
  'VOL',
  'VUL',
  'CIR_P',
  'PAV_N',
] as const;

export type ConstellationIauCode = (typeof CONSTELLATION_IAU_CODES)[number];

export type Constellation = Readonly<{
  iau: ConstellationIauCode;
  nameEn: string;
  nameZh: string;
  lines: readonly (readonly [number, number])[];
  bbox: Readonly<{ raMin: number; raMax: number; decMin: number; decMax: number }>;
}>;

export type Nebula = Readonly<{
  id: string;
  messierId?: string;
  ngcId?: string;
  nameEn?: string;
  nameZh?: string;
  type:
    | 'emission'
    | 'reflection'
    | 'dark'
    | 'planetary'
    | 'snr'
    | 'hii'
    | 'galaxy'
    | 'cluster-open'
    | 'cluster-globular';
  coords: { galactic: GalacticCoords; cartesian: Cartesian3 };
  apparentMagnitude: number | null;
  sizeArcMin?: { major: number; minor: number };
  distanceLy: number | null;
  visualRadiusLy?: number;
}>;

export type CatalogStats = Readonly<{
  totalStars: number;
  tierCounts: Record<CatalogTier, number>;
  spectralCounts: Record<SpectralType, number>;
  constellationCounts: Partial<Record<ConstellationIauCode, number>>;
  bboxLy: { min: Cartesian3; max: Cartesian3 };
  maxDistanceLy: number;
}>;
