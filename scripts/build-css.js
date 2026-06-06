import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const importsFile = path.join(rootDir, 'css', 'style-imports.css');
const outputFile = path.join(rootDir, 'style.css');

function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ')             // Replace multiple spaces/newlines with single space
        .replace(/\s*([{}:;])\s*/g, '$1') // Remove space around symbols
        .replace(/;}/g, '}')              // Remove trailing semicolons in blocks
        .trim();
}

function build() {
    if (!fs.existsSync(importsFile)) {
        console.error(`Error: Source file not found: ${importsFile}`);
        process.exit(1);
    }

    const content = fs.readFileSync(importsFile, 'utf8');
    const importRegex = /@import\s+url\(['"]?([^'")]+)['"]?\);|@import\s+['"]([^'"]+)['"];/g;
    let combinedCSS = '';
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        const relPath = match[1] || match[2];
        const fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
            combinedCSS += fs.readFileSync(fullPath, 'utf8') + '\n';
        } else {
            console.warn(`Warning: Imported file not found: ${relPath}`);
        }
    }

    const minified = minifyCSS(combinedCSS);
    fs.writeFileSync(outputFile, minified);
    console.log(`✓ style.css compiled & minified (${(Buffer.byteLength(minified, 'utf8') / 1024).toFixed(1)} KB)`);
}

build();
