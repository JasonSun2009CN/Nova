import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

if (typeof globalThis !== 'undefined') {
  Dexie.dependencies.indexedDB = globalThis.indexedDB;
  Dexie.dependencies.IDBKeyRange = globalThis.IDBKeyRange;
}
