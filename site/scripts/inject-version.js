const fs = require('fs');
const html = 'index.html';

let content = fs.readFileSync(html, 'utf8');
content = content.replace('{{COMMIT_SHA}}', process.env.VERCEL_GIT_COMMIT_SHA || 'local');
content = content.replace('{{COMMIT_SHORT}}', process.env.VERCEL_GIT_COMMIT_SHORT_SHA || 'dev');
fs.writeFileSync(html, content);