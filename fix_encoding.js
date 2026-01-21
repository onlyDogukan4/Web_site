
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const mapping = [
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚Â¡/g, to: 'Ç' },
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚Â“/g, to: 'Ö' },
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â„ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â±/g, to: 'ı' },
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â…ÃƒÂƒÃ‚Â…ÃƒÂ‚Ã‚Â¸/g, to: 'ş' },
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â„ÃƒÂƒÃ‚Â…ÃƒÂ‚Ã‚Â¸/g, to: 'ş' },
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â¶/g, to: 'ö' },
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â¼/g, to: 'ü' },
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â„ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â°/g, to: 'İ' },
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â„ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚ÂŸ/g, to: 'Ğ' },
    { from: /ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚Â™/g, to: "'" }
];

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Add charset back properly
    if (!content.includes('<meta charset="UTF-8">')) {
        content = content.replace('<head>', '<head>\n    <meta charset="UTF-8">');
    }

    mapping.forEach(m => {
        content = content.replace(m.from, m.to);
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${file}`);
});
