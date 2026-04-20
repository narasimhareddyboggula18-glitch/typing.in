/**
 * push-typeflow.js
 * Pushes the TypeFlow project files to GitHub using the REST API (no git CLI needed).
 * Usage: node push-typeflow.js <GITHUB_PAT>
 */

const https = require('https');
const fs   = require('fs');
const path = require('path');

// Replace these or leave them as is to push to your specific account
const OWNER = 'narasimhareddyboggula18-glitch';
const REPO  = 'typeflow-typing-app';
const TOKEN = process.argv[2];

if (!TOKEN) {
    console.error('\n❌  Usage: node push-typeflow.js <YOUR_GITHUB_PAT>\n');
    console.error('   Generate a token at: https://github.com/settings/tokens');
    console.error('   Required scope: repo (full)\n');
    process.exit(1);
}

// Files to push (all files inside typing-practice except node_modules)
const ROOT = __dirname;
const FILES_TO_PUSH = [
    'server.js',
    'package.json',
    'package-lock.json',
    'vercel.json',
    'index.html',
    'css/style.css',
    'js/app.js'
];

function apiRequest(method, urlPath, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'api.github.com',
            path: urlPath,
            method,
            headers: {
                'Authorization': `token ${TOKEN}`,
                'User-Agent': 'typeflow-pusher',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };
        const req = https.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                catch { resolve({ status: res.statusCode, data: body }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function getFileSha(filePath) {
    const res = await apiRequest('GET', `/repos/${OWNER}/${REPO}/contents/${filePath}`);
    if (res.status === 200 && res.data.sha) return res.data.sha;
    return null;
}

async function pushFile(filePath) {
    const fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`  ⚠️  Skipping ${filePath} — File no longer exists locally.`);
        return;
    }

    const content  = fs.readFileSync(fullPath);
    const encoded  = content.toString('base64');

    const sha = await getFileSha(filePath);

    const body = {
        message: `feat: initial commit for TypeFlow (${filePath})`,
        content: encoded,
        ...(sha ? { sha } : {})
    };

    const res = await apiRequest('PUT', `/repos/${OWNER}/${REPO}/contents/${filePath}`, body);
    if (res.status === 200 || res.status === 201) {
        console.log(`  ✅  ${filePath}`);
    } else {
        console.error(`  ❌  ${filePath} — ${res.status}: ${JSON.stringify(res.data.message || res.data)}`);
    }
}

async function createRepoIfNeeded() {
    const check = await apiRequest('GET', `/repos/${OWNER}/${REPO}`);
    if (check.status === 404) {
        console.log(`\n📦  Repo not found, creating ${OWNER}/${REPO}...`);
        const create = await apiRequest('POST', `/user/repos`, {
            name: REPO, description: 'TypeFlow — Premium Multiplayer Typing Practice',
            private: false, auto_init: false
        });
        if (create.status === 201) console.log('  ✅  Repo created\n');
        else { console.error('  ❌  Could not create repo:', create.data.message); process.exit(1); }
    } else if (check.status === 200) {
        console.log(`\n📦  Pushing to existing repo: ${OWNER}/${REPO}\n`);
    } else {
        console.error('  ❌  GitHub API error:', check.data.message || check.status);
        process.exit(1);
    }
}

(async () => {
    console.log('\n🚀  TypeFlow → GitHub Push Tool\n');
    await createRepoIfNeeded();

    for (const file of FILES_TO_PUSH) {
        await pushFile(file);
        await new Promise(r => setTimeout(r, 300)); // rate-limit buffer
    }

    console.log(`\n✨  Done! You can now import your repository into Vercel or Railway.`);
    console.log(`🔗  View your repo at: https://github.com/${OWNER}/${REPO}\n`);
})();
