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

const dirsToDelete = [
    'test-results',
    'playwright-report',
    'blob-report',
    'coverage'
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
    }
});

dirsToDelete.forEach(dir => {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
        try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`✓ Deleted unused directory: ${dir}`);
        } catch (e) {
            console.error(`✗ Error deleting directory ${dir}:`, e.message);
        }
    }
});

try {
    const files = fs.readdirSync(rootDir);
    files.forEach(file => {
        if (file.endsWith('.log')) {
            fs.unlinkSync(path.join(rootDir, file));
            console.log(`✓ Deleted log file: ${file}`);
        }
    });
} catch (e) {
    console.error(`✗ Error cleaning up log files:`, e.message);
}
