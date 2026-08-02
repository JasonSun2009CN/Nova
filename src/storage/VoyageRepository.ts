import type { Cartesian3, Star } from '@/engine/contract/catalog-types';
import type { VoyageSnapshot } from '@/engine/contract/voyage-types';
import type { VoyageRecord } from '@/contract/storage-types';
import type { NovaDatabase } from '@/storage/NovaDatabase';

export type VoyageCreateInput = {
  snapshot: VoyageSnapshot;
  originStar?: Pick<Star, 'id'> | null;
  destStar?: Pick<Star, 'id'> | null;
  originCoords?: Cartesian3 | null;
  destCoords?: Cartesian3 | null;
  starsVisitedIds?: readonly string[];
  createdAtOverride?: number;
};

export type VoyageListOrder = 'createdAt_desc' | 'traveledLy_desc' | 'startWallTime_asc';

export class VoyageRepository {
  constructor(private readonly db: NovaDatabase) {}

  async save(input: VoyageCreateInput): Promise<VoyageRecord> {
    await this.db.ensureOpen();
    const now = Date.now();
    const endWallTime =
      input.snapshot.state.status === 'idle'
        ? now
        : Math.max(
            input.snapshot.state.lastTickWallTime ?? input.snapshot.createdAt,
            input.snapshot.createdAt,
            now,
          );
    const existing =
      input.snapshot.state.startWallTime ?? input.createdAtOverride ?? input.snapshot.createdAt;
    const startWallTime = existing;
    const id =
      input.snapshot.state.startWallTime != null
        ? `voy-${input.snapshot.createdAt}-${input.snapshot.state.startWallTime}`
        : `voy-${input.snapshot.createdAt}-${Math.floor(Math.random() * 1_000_000)}`;
    const record: VoyageRecord = {
      id,
      status: input.snapshot.state.status,
      vOverC: input.snapshot.opts.vOverC,
      gamma:
        input.snapshot.opts.vOverC >= 1
          ? Number.POSITIVE_INFINITY
          : 1 /
            Math.sqrt(
              Math.max(1 - input.snapshot.opts.vOverC * input.snapshot.opts.vOverC, 1e-300),
            ),
      focusTotalMs: input.snapshot.opts.focusTotalMs,
      elapsedFocusMs: input.snapshot.state.elapsedFocusMs,
      traveledLy: input.snapshot.state.traveledLy,
      startWallTime,
      endWallTime,
      originStarId: input.originStar?.id ?? null,
      originCoords: input.originCoords ?? null,
      destStarId: input.destStar?.id ?? null,
      destCoords: input.destCoords ?? null,
      snapshot: structuredClone(input.snapshot),
      starsVisitedIds: input.starsVisitedIds != null ? Array.from(input.starsVisitedIds) : [],
      createdAt: input.createdAtOverride ?? input.snapshot.createdAt,
      updatedAt: now,
    };
    await this.db.voyages.put(record);
    return record;
  }

  async getById(id: string): Promise<VoyageRecord | undefined> {
    await this.db.ensureOpen();
    return (await this.db.voyages.get(id)) ?? undefined;
  }

  async list(
    opts: {
      order?: VoyageListOrder;
      limit?: number;
      offset?: number;
      statusIn?: readonly VoyageRecord['status'][];
      minTraveledLy?: number;
      afterCreatedAt?: number;
    } = {},
  ): Promise<VoyageRecord[]> {
    await this.db.ensureOpen();
    const order: VoyageListOrder = opts.order ?? 'createdAt_desc';
    let coll = this.db.voyages.toCollection();
    if (opts.statusIn != null && opts.statusIn.length > 0) {
      coll = this.db.voyages.where('status').anyOf(opts.statusIn);
    } else if (opts.afterCreatedAt != null) {
      coll = this.db.voyages.where('createdAt').above(opts.afterCreatedAt);
    } else if (opts.minTraveledLy != null) {
      coll = this.db.voyages.where('traveledLy').aboveOrEqual(opts.minTraveledLy);
    }
    const rows = await coll.toArray();
    switch (order) {
      case 'createdAt_desc':
        rows.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'traveledLy_desc':
        rows.sort((a, b) => b.traveledLy - a.traveledLy);
        break;
      case 'startWallTime_asc':
        rows.sort((a, b) => a.startWallTime - b.startWallTime);
        break;
    }
    const start = Math.max(0, opts.offset ?? 0);
    const end = opts.limit != null ? start + opts.limit : rows.length;
    return rows.slice(start, end);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.ensureOpen();
    const exists = await this.getById(id);
    if (exists == null) return false;
    await this.db.voyages.delete(id);
    return true;
  }

  async clearAll(): Promise<void> {
    await this.db.ensureOpen();
    await this.db.voyages.clear();
  }

  async stats(): Promise<{
    total: number;
    totalFocusHours: number;
    totalTraveledLy: number;
    completedVoyages: number;
  }> {
    await this.db.ensureOpen();
    const all = await this.db.voyages.toArray();
    const completed = all.filter((v) => v.status === 'completed');
    const msToHours = 1 / (60 * 60 * 1000);
    return {
      total: all.length,
      totalFocusHours: all.reduce((acc, v) => acc + v.elapsedFocusMs * msToHours, 0),
      totalTraveledLy: all.reduce((acc, v) => acc + v.traveledLy, 0),
      completedVoyages: completed.length,
    };
  }
}
