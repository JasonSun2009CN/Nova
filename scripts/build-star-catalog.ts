import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { CONSTELLATION_IAU_CODES } from '../src/engine/contract/constellations.ts';
import {
  equatorialToGalacticCartesian,
  parseSpectral,
  type ProtoStar,
} from '../src/engine/data/star-mapper.ts';
import { ZH_STAR_NAMES } from './star-names-zh.ts';

const SOURCE_URL =
  'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/v3/hyg_v35.csv.gz';
const SOURCE_VERSION = 'hyg-v35-r3';
const PC_TO_LY = 3.2616;
const MAX_DIST_LY = 500;
const BRIGHT_TIER_MIN_DIST_LY = 50;
const BRIGHT_TIER_MAX_MAG = 8;
const CHUNK_SIZE = 1000;
const OUT_DIR = 'public/data/stars';

const IAU_SET = new Set<string>(CONSTELLATION_IAU_CODES);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cur);
      cur = '';
    } else if (ch === '\n') {
      row.push(cur);
      cur = '';
      rows.push(row);
      row = [];
    } else if (ch !== '\r') {
      cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function loadCsv(inputPath: string | undefined): string {
  if (inputPath != null) {
    if (!existsSync(inputPath)) throw new Error(`输入文件不存在: ${inputPath}`);
    return readFileSync(inputPath, 'utf8');
  }
  throw new Error('请传入 --input <hyg_v35.csv>（构建脚本不直接依赖网络）');
}

function num(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function temperatureFromBv(ci: number | null): number | undefined {
  if (ci == null || !Number.isFinite(ci)) return undefined;
  const denom = 0.92 * ci + 0.62;
  if (denom <= 0) return undefined;
  return 4600 * (1 / (0.92 * ci + 1.7) + 1 / denom);
}

function buildRows(csvText: string): ProtoStar[] {
  const rows = parseCsv(csvText);
  const header = rows[0]!;
  const col = (name: string): number => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`CSV 缺少列: ${name}`);
    return i;
  };
  const cId = col('id');
  const cHip = col('hip');
  const cGl = col('gl');
  const cProper = col('proper');
  const cRa = col('ra');
  const cDec = col('dec');
  const cDist = col('dist');
  const cMag = col('mag');
  const cAbsmag = col('absmag');
  const cSpect = col('spect');
  const cCi = col('ci');
  const cBayer = col('bayer');
  const cFlam = col('flam');
  const cCon = col('con');
  const cLum = col('lum');

  const byId = new Map<string, ProtoStar>();

  for (let r = 1; r < rows.length; r++) {
    const f = rows[r]!;
    const get = (idx: number): string | undefined => f[idx]?.trim();
    const distPc = num(get(cDist));
    if (distPc == null || distPc <= 0 || distPc >= 100000) continue;
    const distLy = distPc * PC_TO_LY;
    if (distLy > MAX_DIST_LY + 0.001) continue;
    const mag = num(get(cMag));
    if (mag == null) continue;
    if (distLy > BRIGHT_TIER_MIN_DIST_LY && mag > BRIGHT_TIER_MAX_MAG) continue;

    const hip = num(get(cHip));
    const gl = get(cGl);
    const hygId = get(cId);
    const id =
      hip != null
        ? `hip-${hip}`
        : gl != null && gl !== ''
          ? `gl-${gl.replace(/\s+/g, '').replace(/^(Gl|GJ)/, '')}`
          : `hyg-${hygId}`;
    const bayer = get(cBayer) ?? undefined;
    const flam = get(cFlam) ?? undefined;
    const con = get(cCon);
    const conUpper = con != null ? con.toUpperCase() : undefined;
    const constellationIau = conUpper != null && IAU_SET.has(conUpper) ? conUpper : undefined;
    const proper = get(cProper);
    const properName = ZH_STAR_NAMES[id] ?? (proper != null && proper !== '' ? proper : undefined);
    const ci = num(get(cCi));
    const lum = num(get(cLum));
    const absmag = num(get(cAbsmag));

    const proto: ProtoStar = {
      id,
      properName,
      bayer,
      flamsteed: flam,
      constellation: constellationIau,
      raDeg: (num(get(cRa)) ?? 0) * 15,
      decDeg: num(get(cDec)) ?? 0,
      distanceLy: distLy,
      vMag: mag,
      absMag: absmag ?? undefined,
      spectral: get(cSpect) ?? '?',
      luminositySol: lum != null && lum !== 0 ? Math.pow(10, lum) : undefined,
      temperatureK: temperatureFromBv(ci),
      tier: distLy <= BRIGHT_TIER_MIN_DIST_LY ? 'tier1-nearby-100ly' : 'tier2-bright-mag6',
    };

    const existing = byId.get(id);
    if (existing == null || distLy < existing.distanceLy) {
      byId.set(id, proto);
    }
  }
  return [...byId.values()];
}

function buildSun(): ProtoStar {
  return {
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
}

function toStar(p: ProtoStar): unknown {
  const celestial = equatorialToGalacticCartesian(p.raDeg, p.decDeg, p.distanceLy);
  const hipMatch = /^hip(?:-fake)?-(\d+)$/.exec(p.id);
  const hipId = hipMatch != null ? Number(hipMatch[1]) : undefined;
  return {
    id: p.id,
    hipId,
    properName: p.properName,
    bayerName: p.bayer,
    flamsteedName: p.flamsteed,
    constellationIau: p.constellation,
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
    absoluteMagnitude: p.absMag ?? null,
    luminositySol: p.luminositySol,
    temperatureKelvin: p.temperatureK,
    catalogTier: p.tier ?? 'tier1-nearby-100ly',
  };
}

function validate(stars: unknown[]): void {
  const ids = new Set<string>();
  let nanCount = 0;
  const byId = new Map<string, unknown>();
  for (const s of stars as Array<Record<string, unknown>>) {
    const id = String(s.id);
    if (ids.has(id)) throw new Error(`重复 id: ${id}`);
    ids.add(id);
    const c = s.coords as { cartesian: { xLy: number; yLy: number; zLy: number } };
    if (
      !Number.isFinite(c.cartesian.xLy) ||
      !Number.isFinite(c.cartesian.yLy) ||
      !Number.isFinite(c.cartesian.zLy)
    ) {
      nanCount++;
    }
    const dist = Math.hypot(c.cartesian.xLy, c.cartesian.yLy, c.cartesian.zLy);
    if (dist > MAX_DIST_LY + 0.01) throw new Error(`距离超界: ${id} ${dist}ly`);
    byId.set(id, s);
  }
  if (nanCount > 0) throw new Error(`笛卡尔坐标含 NaN: ${nanCount}`);
  if (ids.size < 5000) throw new Error(`星数过少: ${ids.size}（预期 >=5000）`);
  if (!byId.has('hip-sol')) throw new Error('缺少 hip-sol');
  const check = (id: string, minLy: number, maxLy: number) => {
    const s = byId.get(id);
    if (s == null) throw new Error(`缺少 ${id}`);
    const c = (s as { coords: { cartesian: { xLy: number; yLy: number; zLy: number } } }).coords
      .cartesian;
    const d = Math.hypot(c.xLy, c.yLy, c.zLy);
    if (!(d >= minLy && d <= maxLy)) throw new Error(`${id} 距离异常: ${d}`);
  };
  check('hip-91262', 24.5, 25.6); // 织女星
  check('hip-32349', 8.2, 9.0); // 天狼星
  check('hip-87937', 5.6, 6.4); // 巴纳德星
  check('hip-65474', 240, 265); // 角宿一 Spica ~250ly（500ly 亮星层抽样）
  check('hip-30438', 300, 325); // 老人星 Canopus ~310ly（500ly 亮星层抽样）
  console.log(`自校验通过: ${ids.size} 颗，NaN=${nanCount}`);
}

function main(): void {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf('--input');
  const inputPath = inputIdx >= 0 ? args[inputIdx + 1] : undefined;

  const csvText = loadCsv(inputPath);
  const protos = buildRows(csvText);
  protos.unshift(buildSun());
  protos.sort((a, b) => a.distanceLy - b.distanceLy);

  const stars = protos.map(toStar);
  validate(stars);

  mkdirSync(resolve(OUT_DIR), { recursive: true });
  const chunkCount = Math.ceil(stars.length / CHUNK_SIZE);
  const chunkNames: string[] = [];
  for (let i = 0; i < chunkCount; i++) {
    const name = `chunk-${String(i).padStart(3, '0')}`;
    chunkNames.push(name);
    const slice = stars.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    writeFileSync(resolve(OUT_DIR, `${name}.json`), JSON.stringify(slice));
  }
  const manifest = {
    sourceVersion: SOURCE_VERSION,
    totalStars: stars.length,
    chunks: chunkNames,
  };
  writeFileSync(resolve(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(
    `已生成 ${OUT_DIR}: ${stars.length} 颗（含太阳），${chunkNames.length} 个分块，sourceVersion=${SOURCE_VERSION}`,
  );
}

main();
