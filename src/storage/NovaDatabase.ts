import Dexie, { type Table } from 'dexie';

import type {
  SettingsEntry,
  StarCatalogMetaRecord,
  StarChunkRecord,
  VoyageRecord,
} from '@/contract/storage-types';

const DB_NAME = 'nova-db';
const DB_VERSION_V1 = 1;
const DB_VERSION_V2 = 2;

export class NovaDatabase extends Dexie {
  voyages!: Table<VoyageRecord, string>;
  settings!: Table<SettingsEntry, SettingsEntry['key']>;
  starChunks!: Table<StarChunkRecord, string>;
  starCatalogMeta!: Table<StarCatalogMetaRecord, string>;

  constructor(name: string = DB_NAME) {
    super(name, { autoOpen: true, cache: 'immutable' });
    this.version(DB_VERSION_V1).stores({
      voyages:
        'id, status, startWallTime, endWallTime, createdAt, updatedAt, traveledLy, vOverC, originStarId, destStarId',
      settings: 'key, updatedAt',
    });
    this.version(DB_VERSION_V2).stores({
      voyages:
        'id, status, startWallTime, endWallTime, createdAt, updatedAt, traveledLy, vOverC, originStarId, destStarId',
      settings: 'key, updatedAt',
      starChunks: 'id, sourceVersion',
      starCatalogMeta: 'id',
    });
    this.voyages = this.table('voyages');
    this.settings = this.table('settings');
    this.starChunks = this.table('starChunks');
    this.starCatalogMeta = this.table('starCatalogMeta');
  }

  async ensureOpen(): Promise<void> {
    if (this.isOpen()) return;
    await this.open();
  }

  static async temp<T>(name: string, work: (db: NovaDatabase) => Promise<T>): Promise<T> {
    const db = new NovaDatabase(name);
    try {
      await db.ensureOpen();
      return await work(db);
    } finally {
      db.close();
      await Dexie.delete(name);
    }
  }
}
