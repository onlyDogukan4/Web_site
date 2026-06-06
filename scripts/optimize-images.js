import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const imagesDir = path.join(rootDir, 'images');

async function optimizeImages() {
    if (!fs.existsSync(imagesDir)) {
        console.error(`Error: Images directory not found: ${imagesDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(imagesDir);
    console.log(`Scanning ${files.length} files in images/ directory...`);
    let totalSaved = 0;

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') continue;

        const filePath = path.join(imagesDir, file);
        const stats = fs.statSync(filePath);
        const originalSize = stats.size;

        // Skip small files (under 100 KB) to avoid unnecessary processing
        if (originalSize < 100 * 1024) {
            console.log(`- Skipping ${file} (already small: ${(originalSize / 1024).toFixed(1)} KB)`);
            continue;
        }

        console.log(`Optimizing ${file} (${(originalSize / 1024).toFixed(1)} KB)...`);
        const tempPath = filePath + '.tmp';

        try {
            if (ext === '.png') {
                await sharp(filePath)
                    .png({ quality: 80, compressionLevel: 9, palette: true })
                    .toFile(tempPath);
            } else {
                await sharp(filePath)
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(tempPath);
            }

            const newStats = fs.statSync(tempPath);
            const newSize = newStats.size;

            if (newSize < originalSize) {
                fs.renameSync(tempPath, filePath);
                const saved = originalSize - newSize;
                totalSaved += saved;
                console.log(`  ✓ Compressed: ${(originalSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (-${((saved / originalSize) * 100).toFixed(1)}%)`);
            } else {
                fs.unlinkSync(tempPath);
                console.log(`  - Kept original (no size reduction)`);
            }
        } catch (e) {
            console.error(`  ✗ Error optimizing ${file}:`, e.message);
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }

    console.log(`\n🎉 Image optimization complete! Total saved: ${(totalSaved / (1024 * 1024)).toFixed(2)} MB\n`);
}

optimizeImages();
