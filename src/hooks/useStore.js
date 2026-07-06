/* Bridges the mutable store to React: components re-render whenever
   any store mutation calls save(). */
import { useSyncExternalStore } from 'react';
import * as Store from '../lib/store.js';

export function useStoreRev() {
  return useSyncExternalStore(Store.subscribe, Store.getRev, Store.getRev);
}
