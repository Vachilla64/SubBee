const fs = require('fs');
const path = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\eedaafa0-1ad8-4ac4-816a-f31102a6f770\\.system_generated\\steps\\1274\\content.md';
const content = fs.readFileSync(path, 'utf8');

const regex = /register_cardholder_synchronously/g;
let match;
while ((match = regex.exec(content)) !== null) {
    const start = Math.max(0, match.index - 500);
    const end = Math.min(content.length, match.index + 2000);
    console.log(`--- MATCH AT ${match.index} ---`);
    console.log(content.substring(start, end));
}
