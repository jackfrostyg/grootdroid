// Script to generate database with Google Drive links
// 
// HOW TO USE:
// 1. Upload your database folder to Google Drive
// 2. Get shareable links for each file (Right-click > Get link > Anyone with link can view)
// 3. Create a mapping file (gdrive-links.json) with file paths and their Google Drive links
// 4. Run this script: node generate-gdrive-database.js
//
// Example gdrive-links.json format:
// {
//   "360/360N6Lite_devprg": "https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing",
//   "Xiaomi/XiaomiCommon888_devprg": "https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
// }

const fs = require('fs');
const path = require('path');

const sourceFolder = './database';
const gdriveLinksFile = './gdrive-links.json';
const outputFile = 'file-database.js';

// Convert Google Drive view link to direct download link
function convertToDirectLink(viewLink) {
    // Extract file ID from Google Drive link
    const match = viewLink.match(/\/file\/d\/([^\/]+)/);
    if (match && match[1]) {
        const fileId = match[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return viewLink;
}

function getAllFiles(dirPath, arrayOfFiles = [], brand = '', gdriveLinks = {}) {
    try {
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                const newBrand = brand || file;
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, newBrand, gdriveLinks);
            } else {
                const relativePath = path.relative(sourceFolder, fullPath);
                const normalizedPath = relativePath.replace(/\\/g, '/');
                const fileName = path.basename(file, path.extname(file));
                
                // Extract chipset info from filename
                const chipsetMatch = fileName.match(/(\d{3,4}[a-z]*)/i);
                const chipset = chipsetMatch ? chipsetMatch[1] : '';
                
                // Get Google Drive link if available, otherwise use relative path
                const filePath = gdriveLinks[normalizedPath] 
                    ? convertToDirectLink(gdriveLinks[normalizedPath])
                    : relativePath.replace(/\\/g, '\\\\');
                
                arrayOfFiles.push({
                    name: fileName,
                    path: filePath,
                    fullPath: filePath,
                    brand: brand,
                    chipset: chipset,
                    keywords: [
                        fileName.toLowerCase(),
                        brand.toLowerCase(),
                        chipset.toLowerCase(),
                        ...fileName.toLowerCase().split(/[_\-\s]+/),
                    ].filter(k => k.length > 0)
                });
            }
        });
    } catch (err) {
        console.error('Error reading directory:', err);
    }

    return arrayOfFiles;
}

// Load Google Drive links mapping
let gdriveLinks = {};
if (fs.existsSync(gdriveLinksFile)) {
    try {
        gdriveLinks = JSON.parse(fs.readFileSync(gdriveLinksFile, 'utf8'));
        console.log(`✓ Loaded ${Object.keys(gdriveLinks).length} Google Drive links`);
    } catch (err) {
        console.error('Error reading gdrive-links.json:', err);
        process.exit(1);
    }
} else {
    console.log('⚠ No gdrive-links.json found.');
    console.log('Run: node get-gdrive-links.js first');
    process.exit(1);
}

// Generate database from Google Drive links only (no local folder needed)
console.log('Generating database from Google Drive links...');
const fileDatabase = [];

Object.keys(gdriveLinks).forEach(filePath => {
    const fileName = filePath.split('/').pop();
    
    // Extract brand from path (first folder)
    const pathParts = filePath.split('/');
    const brand = pathParts.length > 1 ? pathParts[0] : '';
    
    // Extract chipset info from filename
    const chipsetMatch = fileName.match(/(\d{3,4}[a-z]*)/i);
    const chipset = chipsetMatch ? chipsetMatch[1] : '';
    
    // Get Google Drive link
    const driveLink = convertToDirectLink(gdriveLinks[filePath]);
    
    fileDatabase.push({
        name: fileName,
        path: driveLink,
        fullPath: driveLink,
        brand: brand,
        chipset: chipset,
        keywords: [
            fileName.toLowerCase(),
            brand.toLowerCase(),
            chipset.toLowerCase(),
            ...fileName.toLowerCase().split(/[_\-\s]+/),
        ].filter(k => k.length > 0)
    });
});

const output = `// Auto-generated file database with Google Drive links
// Generated on: ${new Date().toISOString()}
// Total files: ${fileDatabase.length}

const fileDatabase = ${JSON.stringify(fileDatabase, null, 2)};

// Base folder path (not used for Google Drive links)
const baseFolderPath = ".\\\\database";
`;

fs.writeFileSync(outputFile, output, 'utf8');
console.log(`✓ Database generated successfully!`);
console.log(`✓ Total files indexed: ${fileDatabase.length}`);
console.log(`✓ Output file: ${outputFile}`);

const filesWithGDrive = fileDatabase.filter(f => f.path.startsWith('http')).length;
console.log(`✓ Files with Google Drive links: ${filesWithGDrive}`);
console.log(`✓ Files with local paths: ${fileDatabase.length - filesWithGDrive}`);
