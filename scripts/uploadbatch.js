const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const DEFAULT_BUCKET = 'main';
const DEFAULT_PUBLIC_DOMAIN = 'https://r2.gennesis.cc';
const JURISDICTION = 'eu';

const folder = process.argv[2];
const bucket = process.argv[3] || DEFAULT_BUCKET;

if (!folder) {
    console.error('Usage: node upload-batch.js <folder> [bucket-name]');
    process.exit(1);
}

if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    console.error(`Folder not found: ${folder}`);
    process.exit(1);
}

const files = fs.readdirSync(folder).filter(f => {
    const full = path.join(folder, f);
    return fs.statSync(full).isFile();
});

if (files.length === 0) {
    console.log('No files found in folder.');
    process.exit(0);
}

const results = [];

for (const file of files) {
    const fullPath = path.join(folder, file);
    const ext = path.extname(file);
    const randomName = crypto.randomBytes(8).toString('hex') + ext;

    console.log(`Uploading ${file} -> ${bucket}/${randomName} ...`);

    try {
        execSync(
            `npx wrangler r2 object put ${bucket}/${randomName} --file="${fullPath}" --remote --jurisdiction ${JURISDICTION}`,
            { stdio: 'inherit' }
        );
        results.push({ original: file, url: `${DEFAULT_PUBLIC_DOMAIN}/${randomName}` });
    } catch (err) {
        console.error(`Failed to upload ${file}, skipping.`);
    }
}

console.log('\n=== Upload complete ===');
console.log('original -> new URL\n');
for (const r of results) {
    console.log(`${r.original} -> ${r.url}`);
}