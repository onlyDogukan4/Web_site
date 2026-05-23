import { vi } from 'vitest';

/** Bellek içi veritabanı — integration testlerde MongoDB gerektirmez */
export function createMemoryDb() {
    const store = new Map();

    return {
        reset() {
            store.clear();
        },
        seed(collection, data) {
            store.set(collection, JSON.parse(JSON.stringify(data)));
        },
        get(collection) {
            return store.get(collection) ?? [];
        },
        mockModule() {
            return {
                readData: vi.fn(async (filename, fallback = []) => {
                    return store.has(filename) ? store.get(filename) : fallback;
                }),
                writeData: vi.fn(async (filename, data) => {
                    store.set(filename, JSON.parse(JSON.stringify(data)));
                    return true;
                }),
                corsHeaders: vi.fn((res) => {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                }),
                getCollection: vi.fn(),
            };
        },
    };
}
