import { MongoClient } from 'mongodb';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('❌ MONGODB_URI .env dosyasında bulunamadı!');
    process.exit(1);
}

const collectionsToMigrate = [
    'products',
    'orders',
    'campaigns',
    'settings',
    'packages',
    'concepts',
    'last-update'
];

async function migrate() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('✅ MongoDB\'ye bağlanıldı.');
        const db = client.db('moderra_db');

        for (const colName of collectionsToMigrate) {
            const filePath = join(ROOT, `${colName}.json`);
            if (existsSync(filePath)) {
                console.log(`📂 ${colName}.json okunuyor...`);
                const content = readFileSync(filePath, 'utf8');
                let data = JSON.parse(content);

                if (data) {
                    const collection = db.collection(colName);
                    // Temizle ve ekle
                    await collection.deleteMany({});
                    
                    if (Array.isArray(data)) {
                        if (data.length > 0) {
                            // MongoDB insertMany boş dizi sevmez, yukardaki kontrol o yüzden
                            await collection.insertMany(data);
                        }
                    } else {
                        await collection.insertOne(data);
                    }
                    console.log(`✅ ${colName} koleksiyonu başarıyla yüklendi.`);
                }
            } else {
                console.log(`ℹ️ ${colName}.json bulunamadı, atlanıyor.`);
            }
        }
        console.log('\n🚀 Tüm veriler başarıyla MongoDB Atlas\'a taşındı!');
    } catch (e) {
        console.error('❌ Hata:', e);
    } finally {
        await client.close();
    }
}

migrate();
