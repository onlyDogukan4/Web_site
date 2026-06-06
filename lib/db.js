import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

/** Test/E2E sunucusu için bellek içi depolama (USE_MEMORY_DB=true) */
const memoryStore = new Map();

export function resetMemoryDb() {
    memoryStore.clear();
}

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (uri && process.env.USE_MEMORY_DB !== 'true') {
    client = new MongoClient(uri);
    clientPromise = client.connect();
} else if (!uri) {
    console.warn('⚠️ MONGODB_URI tanımlanmamış. Yerel JSON moduna geçiliyor (Vercel\'de çalışmaz).');
}

export async function getCollection(name) {
    if (!clientPromise) return null;
    const conn = await clientPromise;
    return conn.db('moderra_db').collection(name);
}

export async function readData(filename, fallback = []) {
    if (process.env.USE_MEMORY_DB === 'true') {
        return memoryStore.has(filename) ? memoryStore.get(filename) : fallback;
    }
    try {
        const col = await getCollection(filename);
        if (!col) return fallback;
        const data = await col.find({}, { projection: { _id: 0 } }).toArray();
        return data.length ? data : fallback;
    } catch (e) {
        console.error(`readData(${filename}) hata:`, e);
        return fallback;
    }
}

export async function writeData(filename, data) {
    if (process.env.USE_MEMORY_DB === 'true') {
        memoryStore.set(filename, JSON.parse(JSON.stringify(data)));
        return true;
    }
    try {
        const col = await getCollection(filename);
        if (!col) return false;

        await col.deleteMany({});
        if (Array.isArray(data) && data.length > 0) {
            await col.insertMany(data);
        } else if (!Array.isArray(data) && data) {
            await col.insertOne(data);
        }
        return true;
    } catch (e) {
        console.error(`writeData(${filename}) hata:`, e);
        return false;
    }
}

export function corsHeaders(res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
}
