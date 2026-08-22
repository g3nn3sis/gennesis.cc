const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const DEFAULT_BUCKET = 'main';
const DEFAULT_PUBLIC_DOMAIN = 'https://r2.gennesis.cc';
const JURISDICTION = 'eu';

const filePath = process.argv[2];
const bucket = process.argv[3] || DEFAULT_BUCKET;

if (!filePath) {
    console.error('Usage: node upload.js <path-to-file> [bucket-name]');
    process.exit(1);
}

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const ext = path.extname(filePath);
const randomName = crypto.randomBytes(8).toString('hex') + ext;

console.log(`Uploading ${filePath} -> ${bucket}/${randomName} ...`);

try {
    execSync(
        `npx wrangler r2 object put ${bucket}/${randomName} --file="${filePath}" --remote --jurisdiction ${JURISDICTION}`,
        { stdio: 'inherit' }
    );
} catch (err) {
    console.error('Upload failed.');
    process.exit(1);
}

const url = `${DEFAULT_PUBLIC_DOMAIN}/${randomName}`;
console.log('\nDone. Public URL:');
console.log(url);