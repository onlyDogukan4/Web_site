// Moderra — JSON dosya tabanlı veri yönetimi (Upstash kaldırıldı)

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

export function readData(filename, fallback = []) {
    try {
        const path = join(ROOT, `${filename}.json`);
        if (!existsSync(path)) return fallback;
        const raw = readFileSync(path, 'utf8');
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function writeData(filename, data) {
    try {
        writeFileSync(join(ROOT, `${filename}.json`), JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch {
        return false;
    }
}

export function corsHeaders(res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}
