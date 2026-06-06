/**
 * Vercel Hobby: api/ altındaki her .js = 1 serverless function.
 * Bu script deploy öncesi sayımı doğrular (hedef: ≤5).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const apiDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'api');
const MAX = 5;

const files = fs
    .readdirSync(apiDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.js'))
    .map((e) => e.name);

console.log(`api/ serverless dosyaları (${files.length}):`, files.join(', '));

if (files.length > MAX) {
    console.error(`HATA: ${files.length} fonksiyon — Hobby limiti için en fazla ${MAX} olmalı.`);
    process.exit(1);
}

console.log(`OK: ${files.length} fonksiyon (limit ${MAX}).`);
process.exit(0);
