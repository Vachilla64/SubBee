const fs = require('fs');
const content = fs.readFileSync('C:/Users/USER/.gemini/antigravity/brain/eedaafa0-1ad8-4ac4-816a-f31102a6f770/.system_generated/steps/1748/content.md', 'utf8');

const regex = /href="([^"]+)"/g;
let match;
const links = new Set();
while ((match = regex.exec(content)) !== null) {
  const link = match[1];
  if (link.includes('fund') || link.includes('card')) {
    links.add(link);
  }
}
console.log(Array.from(links).join('\n'));
