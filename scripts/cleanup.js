import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const filesToDelete = [
    'bilge_adam.png',
    'cart-system.js'
];

filesToDelete.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✓ Deleted unused file: ${file}`);
        } catch (e) {
            console.error(`✗ Error deleting ${file}:`, e.message);
        }
    } else {
        console.log(`- File already deleted or not found: ${file}`);
    }
});
