import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);

if (styleMatch) {
    fs.writeFileSync(path.join(root, 'css', 'admin.css'), styleMatch[1].trim() + '\n');
}

if (scriptMatch) {
    fs.mkdirSync(path.join(root, 'js', 'admin'), { recursive: true });
    fs.writeFileSync(path.join(root, 'js', 'admin', 'app.js'), scriptMatch[1].trim() + '\n');
}

let updated = html
    .replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="css/admin.css">')
    .replace(
        /<script>[\s\S]*?<\/script>\s*<\/body>/,
        '<script type="module" src="js/admin/index.js"></script>\n</body>'
    );

fs.writeFileSync(path.join(root, 'admin.html'), updated);
console.log('admin.html → css/admin.css + js/admin/app.js');
