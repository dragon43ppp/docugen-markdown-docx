import fs from 'fs';
import path from 'path';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Load API Key
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
}

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

console.log(`🔑 API Key found: ${apiKey.substring(0, 5)}...`);

// 2. Setup Proxy
const PROXY_URL = 'http://127.0.0.1:7897';
const agent = new HttpsProxyAgent(PROXY_URL);
console.log(`🌐 Using Proxy: ${PROXY_URL}`);

// Helper function to make request using https module + agent
function makeRequest(url, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: method,
            agent: agent,
            headers: {}
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error("Invalid JSON response"));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

// 3. Test Function
async function test() {
    console.log("\n🔍 Fetching available models...");
    
    try {
        const data = await makeRequest(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const models = data.models || [];
        
        console.log(`✅ Found ${models.length} models.`);
        
        const geminiModels = models.filter(m => m.name.includes('gemini'));
        console.log("\n📋 Available Gemini Models:");
        geminiModels.forEach(m => {
            console.log(`   - ${m.name.replace('models/', '')}`);
        });

        // 4. Test Generation with a few key models
        const candidates = ['gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-2.5-flash'];
        console.log("\n🧪 Testing generation capability...");

        for (const modelName of candidates) {
            // console.log(`\nTesting ${modelName}...`);
            process.stdout.write(`\nTesting ${modelName}... `);
            try {
                const genData = await makeRequest(
                    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                    'POST',
                    JSON.stringify({
                        contents: [{ parts: [{ text: "Say OK" }] }]
                    })
                );
                
                const text = genData.candidates?.[0]?.content?.parts?.[0]?.text;
                console.log(`✅ Success!`);
            } catch (e) {
                console.log(`❌ Failed: ${e.message.substring(0, 100)}...`);
            }
        }

    } catch (error) {
        console.error("❌ Fatal Error:", error.message);
    }
}

test();
