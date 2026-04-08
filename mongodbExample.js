import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// .env dosyasındaki değişkenleri yükle
dotenv.config();

/**
 * MONGODB ATLAS ÖRNEK KULLANIM (Audit Log)
 * 
 * Bu dosya MongoDB Atlas bağlantısını, veri eklemeyi ve sorgulamayı
 * en basit ve modaya uygun (async/await) yöntemlerle gösterir.
 */

// 1. Bağlantı dizesini kontrol et
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ HATA: MONGODB_URI ortam değişkeni bulunamadı!');
    console.log('Lütfen .env dosyanıza MONGODB_URI="mongodb+srv://..." satırını ekleyin.');
    process.exit(1);
}

// 2. MongoClient yapılandırması
const client = new MongoClient(uri);

async function run() {
    try {
        console.log('🔄 MongoDB Atlas\'a bağlanılıyor...');
        await client.connect();
        console.log('✅ Bağlantı başarılı!');

        const db = client.db('moderra_db'); // Veritabanı adı
        const collection = db.collection('audit_logs'); // Koleksiyon adı

        // 3. Örnek verileri hazırla (10 tane gerçekçi Audit Log)
        const sampleLogs = [
            { action: 'user_login', user: 'admin@moderra.com', ip: '192.168.1.1', status: 'success', timestamp: new Date(Date.now() - 100000) },
            { action: 'product_add', user: 'editor@moderra.com', product: '8oz Bardak', status: 'success', timestamp: new Date(Date.now() - 90000) },
            { action: 'price_update', user: 'admin@moderra.com', product: '12oz Bardak', oldPrice: 15, newPrice: 18, timestamp: new Date(Date.now() - 80000) },
            { action: 'order_create', user: 'customer_123', total: 450, status: 'pending', timestamp: new Date(Date.now() - 70000) },
            { action: 'payment_success', user: 'customer_123', orderId: 'MOD-9921', amount: 450, timestamp: new Date(Date.now() - 60000) },
            { action: 'campaign_create', user: 'admin@moderra.com', name: 'Yaz Fırsatı', timestamp: new Date(Date.now() - 50000) },
            { action: 'stock_oos', product: '4oz Kapaklı', timestamp: new Date(Date.now() - 40000) },
            { action: 'user_logout', user: 'editor@moderra.com', timestamp: new Date(Date.now() - 30000) },
            { action: 'setting_change', key: 'minOrder', value: 600, timestamp: new Date(Date.now() - 20000) },
            { action: 'order_status_update', orderId: 'MOD-9921', newStatus: 'kargoda', timestamp: new Date() }
        ];

        // 4. Verileri ekle (insertMany)
        console.log('📝 Örnek loglar ekleniyor...');
        const result = await collection.insertMany(sampleLogs);
        console.log(`✅ ${result.insertedCount} adet log başarıyla eklendi.`);

        // 5. En son eklenen 5 logu getir (Sıralama: timestamp -1)
        console.log('\n🔍 En son 5 Audit Log getiriliyor:');
        const recentLogs = await collection.find({})
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();

        recentLogs.forEach((log, index) => {
            console.log(`${index + 1}. [${log.timestamp.toLocaleString()}] ${log.action} - ${log.user || 'Sistem'}`);
        });

        // 6. Belirli bir ID ile döküman getir
        const targetId = result.insertedIds[0];
        console.log(`\n🆔 Tekil döküman sorgulanıyor (ID: ${targetId}):`);
        const singleLog = await collection.findOne({ _id: targetId });
        console.log('Sonuç:', JSON.stringify(singleLog, null, 2));

    } catch (err) {
        console.error('❌ BİR HATA OLUŞTU:', err.message);
    } finally {
        // 7. Bağlantıyı her zaman kapat
        await client.close();
        console.log('\n🔌 Bağlantı kapatıldı.');
    }
}

// Uygulamayı başlat
run();
