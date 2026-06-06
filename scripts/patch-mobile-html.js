import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = fs.readdirSync(root).filter((f) => f.endsWith('.html'));

const viewport =
    'width=device-width, initial-scale=1.0, viewport-fit=cover';
const viewportOld = /content="width=device-width, initial-scale=1\.0"/g;

for (const file of files) {
    let html = fs.readFileSync(path.join(root, file), 'utf8');
    let changed = false;

    if (html.includes('style.css') && !html.includes('js/mobile.js')) {
        html = html.replace(/<\/body>/i, '    <script src="js/mobile.js" defer></script>\n</body>');
        changed = true;
    }

    if (viewportOld.test(html)) {
        html = html.replace(viewportOld, `content="${viewport}"`);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(path.join(root, file), html);
        console.log('Updated:', file);
    }
}

console.log('Done');
