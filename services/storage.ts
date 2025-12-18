import { get, set } from 'idb-keyval';
import { GeneratedItem } from '../types';

const STORE_KEY = 'identityforge_library_v2';

export const loadSavedLibrary = async (): Promise<GeneratedItem[]> => {
  try {
    const items = await get<GeneratedItem[]>(STORE_KEY);
    return items || [];
  } catch (error) {
    console.warn('Failed to load library from storage:', error);
    return [];
  }
};

export const saveLibraryToStorage = async (items: GeneratedItem[]) => {
  try {
    await set(STORE_KEY, items);
  } catch (error) {
    console.warn('Failed to save library to storage:', error);
  }
};
