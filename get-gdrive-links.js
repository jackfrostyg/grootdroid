// Automated Google Drive Link Extractor
// This script gets all shareable links from your Google Drive folder

const fs = require('fs');
const { google } = require('googleapis');
const readline = require('readline');

// Configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const TOKEN_PATH = 'gdrive-token.json';
const CREDENTIALS_PATH = 'gdrive-credentials.json';

// Your Google Drive folder ID (you'll get this from the folder URL)
let FOLDER_ID = 'PASTE_YOUR_FOLDER_ID_HERE';

// Prompt for folder ID if not set
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('========================================');
    console.log('Google Drive Link Extractor');
    console.log('========================================\n');

    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error('❌ Error: gdrive-credentials.json not found!');
        console.log('\nPlease follow the setup guide in GDRIVE-SETUP.txt\n');
        process.exit(1);
    }

    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id } = credentials.installed || credentials.web;
    // Use urn:ietf:wg:oauth:2.0:oob for installed apps (gets code directly)
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'urn:ietf:wg:oauth:2.0:oob');

    // Check if we have a token
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(token);
    } else {
        // Get new token
        await getNewToken(oAuth2Client);
    }

    // Ask for folder ID if not set
    if (FOLDER_ID === 'PASTE_YOUR_FOLDER_ID_HERE') {
        FOLDER_ID = await askQuestion('\nEnter your Google Drive folder ID: ');
    }

    console.log('\n🔍 Scanning Google Drive folder...\n');

    // Get all files
    const files = await getAllFilesRecursive(oAuth2Client, FOLDER_ID);
    
    console.log(`✓ Found ${files.length} files\n`);
    console.log('📝 Generating gdrive-links.json...\n');

    // Create the links mapping
    const linksMapping = {};
    files.forEach(file => {
        const link = `https://drive.google.com/file/d/${file.id}/view?usp=sharing`;
        linksMapping[file.path] = link;
        console.log(`  ✓ ${file.path}`);
    });

    // Save to gdrive-links.json
    fs.writeFileSync('gdrive-links.json', JSON.stringify(linksMapping, null, 2));

    console.log('\n========================================');
    console.log('✅ SUCCESS!');
    console.log('========================================\n');
    console.log(`✓ Created gdrive-links.json with ${files.length} files`);
    console.log('\nNext step: Run "node generate-gdrive-database.js"\n');
    
    rl.close();
}

// Get new OAuth token
async function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    
    console.log('\n========================================');
    console.log('AUTHORIZATION REQUIRED');
    console.log('========================================\n');
    console.log('Opening browser for authorization...\n');
    
    // Try to open browser automatically
    const { exec } = require('child_process');
    exec(`start "" "${authUrl}"`, (err) => {
        if (err) {
            console.log('Could not open browser automatically.');
            console.log('Please visit this URL manually:\n');
            console.log(authUrl);
        }
    });
    
    console.log('If browser didn\'t open, copy this URL:\n');
    console.log(authUrl);
    console.log('\nSteps:');
    console.log('1. Sign in to your Google account');
    console.log('2. Click "Continue" to authorize');
    console.log('3. Google will show you an authorization code');
    console.log('4. Copy the ENTIRE code\n');
    console.log('========================================\n');
    
    const code = await askQuestion('Paste the authorization code here: ');
    
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        
        // Save token
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log('\n✓ Token saved successfully!');
    } catch (err) {
        console.error('\n❌ Error getting token:', err.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure you copied the ENTIRE code');
        console.log('2. Make sure the code hasn\'t expired (they expire quickly)');
        console.log('3. Try running the script again and getting a fresh code\n');
        process.exit(1);
    }
}

// Ask question helper
function askQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer.trim());
        });
    });
}

// Get all files recursively
async function getAllFilesRecursive(auth, folderId, basePath = '') {
    const drive = google.drive({ version: 'v3', auth });
    let allFiles = [];

    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType)',
            pageSize: 1000,
        });

        const items = res.data.files;
        
        for (const item of items) {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
                // It's a folder, recurse into it
                const subPath = basePath ? `${basePath}/${item.name}` : item.name;
                const subFiles = await getAllFilesRecursive(auth, item.id, subPath);
                allFiles = allFiles.concat(subFiles);
            } else {
                // It's a file
                const filePath = basePath ? `${basePath}/${item.name}` : item.name;
                allFiles.push({
                    id: item.id,
                    name: item.name,
                    path: filePath
                });
            }
        }
    } catch (err) {
        console.error('Error accessing Google Drive:', err.message);
    }

    return allFiles;
}

// Run the script
main().catch(console.error);
