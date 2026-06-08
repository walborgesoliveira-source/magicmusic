const http = require('http');
const fs = require('fs');
const path = require('path');

// Manually parse .env file (no dotenv package required)
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const eqIndex = trimmed.indexOf('=');
                    if (eqIndex > 0) {
                        const key = trimmed.substring(0, eqIndex).trim();
                        let val = trimmed.substring(eqIndex + 1).trim();
                        // Remove surrounding quotes if present
                        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.substring(1, val.length - 1);
                        }
                        process.env[key] = val;
                    }
                }
            });
            console.log("Environment variables loaded from .env");
        }
    } catch (e) {
        console.error("Error loading .env file:", e);
    }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// Helper to load songs from local JSON database
function readDb() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify({ songs: [] }, null, 2));
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading database:", error);
        return { songs: [] };
    }
}

// Helper to write songs to local JSON database
function writeDb(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing database:", error);
    }
}

// Request body parser helper
function getJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', err => reject(err));
    });
}

// Response helper
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg'
};

const server = http.createServer(async (req, res) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // --- API ROUTES ---

    // 1. Generate Lyrics via Gemini API
    if (req.method === 'POST' && pathname === '/api/generate-lyrics') {
        try {
            const { occasion, style, name, stories, vibes } = await getJsonBody(req);
            if (!name) {
                return sendJson(res, 400, { error: "Name is required." });
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
                return sendJson(res, 500, { error: "GEMINI_API_KEY is not configured on the server." });
            }

            const vibesText = Array.isArray(vibes) ? vibes.join(', ') : (vibes || "alegre");
            
            const prompt = `
                Você é o compositor poético profissional do Magic Music (magicmusic.com), uma IA de criação musical personalizada em português.
                Sua missão é criar a letra de uma canção personalizada com rimas perfeitas, ritmo incrível e alto impacto emocional ou engraçado.
                
                Informações do destinatário:
                - Ocasião: ${occasion || "Geral"}
                - Estilo Musical: ${style || "Pop"}
                - Nome do destinatário: ${name}
                - Histórias/Piadas internas/Detalhes importantes: ${stories || "Nenhuma"}
                - Sentimentos/Vibes indicadas: ${vibesText}

                Regras de Estrutura da Letra:
                - Crie um título original, poético e cativante no campo "title".
                - Escreva a letra da canção no campo "lyrics" em português.
                - A letra DEVE conter exatamente de 4 a 6 estrofes intercaladas com um Refrão marcante. Ex:
                  [Verso 1]
                  (linhas de verso)
                  
                  [Refrão]
                  (linhas de refrão)
                  
                  [Verso 2]
                  (linhas de verso)
                  
                  [Refrão]
                  (linhas de refrão)
                  
                  [Outro]
                  (linhas de desfecho)
                - Mantenha cada linha curta, limpa e poética. Use boas rimas (AABB, ABAB, etc.).
                - No campo "sunoPrompt", crie uma lista de tags de estilo musical em inglês que descreva perfeitamente o arranjo desejado para o Suno AI (ex: "acoustic pop, slow, warm, male vocals, nostalgic").

                Por favor, responda estritamente no formato de JSON obedecendo a estrutura abaixo, sem comentários adicionais fora do JSON:
                {
                  "title": "Título da Música",
                  "artist": "Magic Music AI & ${name}",
                  "lyrics": "[Verso 1]\\nLinha 1...\\nLinha 2...\\n\\n[Refrão]\\nRefrão linha 1...\\nRefrão linha 2...\\n\\n[Verso 2]\\n...",
                  "sunoPrompt": "acoustic pop, male vocals, slow, nostalgic",
                  "durationSeconds": 120
                }
            `;

            const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            console.log(`Calling Gemini API (${modelName}) to generate lyrics for ${name}...`);
            
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.7
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Gemini API error:", errText);
                throw new Error(`Gemini API failed with status ${response.status}`);
            }

            const responseData = await response.json();
            const candidate = responseData.candidates?.[0];
            const textOutput = candidate?.content?.parts?.[0]?.text;
            
            if (!textOutput) {
                throw new Error("No text output received from Gemini.");
            }

            const parsedJson = JSON.parse(textOutput.trim());
            
            const colors = ["0xFFF43F5E", "0xFF8B5CF6", "0xFFD946EF", "0xFF06B6D4", "0xFF10B981", "0xFFF59E0B"];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const db = readDb();
            const newSong = {
                id: db.songs.length > 0 ? Math.max(...db.songs.map(s => s.id)) + 1 : 1,
                title: parsedJson.title || `Canção para ${name}`,
                artist: parsedJson.artist || `Magic Music AI & ${name}`,
                language: occasion || "Geral",
                category: style || "Pop",
                coverColorHex: randomColor,
                originalLyrics: parsedJson.lyrics || "",
                translatedLyrics: "Sincronizada via TTS. Gênero: " + style,
                romanization: vibesText,
                durationSeconds: parsedJson.durationSeconds || 120,
                sunoPrompt: parsedJson.sunoPrompt || "pop, male vocals",
                audioUrl: null,
                status: "pending_audio", // pending_audio, ready
                isPurchased: false,
                isFavorite: false,
                createdAt: new Date().toISOString()
            };

            db.songs.push(newSong);
            writeDb(db);

            console.log(`Lyrics generated and song saved. ID: ${newSong.id}`);
            return sendJson(res, 200, newSong);

        } catch (error) {
            console.error("Error in generate-lyrics:", error);
            return sendJson(res, 500, { error: "Failed to generate song lyrics. " + error.message });
        }
    }

    // 2. Fetch all songs
    if (req.method === 'GET' && pathname === '/api/songs') {
        const db = readDb();
        return sendJson(res, 200, db.songs);
    }

    // 3. Admin: Get pending songs
    if (req.method === 'GET' && pathname === '/api/admin/pending') {
        const db = readDb();
        const pending = db.songs.filter(s => s.status === 'pending_audio');
        return sendJson(res, 200, pending);
    }

    // 4. Admin: Submit generated audio link
    if (req.method === 'POST' && pathname === '/api/admin/submit-audio') {
        try {
            const { songId, audioUrl } = await getJsonBody(req);
            if (!songId || !audioUrl) {
                return sendJson(res, 400, { error: "songId and audioUrl are required." });
            }

            const db = readDb();
            const songIndex = db.songs.findIndex(s => s.id === parseInt(songId));
            if (songIndex === -1) {
                return sendJson(res, 404, { error: "Song not found." });
            }

            db.songs[songIndex].audioUrl = audioUrl;
            db.songs[songIndex].status = "ready";
            writeDb(db);

            console.log(`Suno audio linked to song ID ${songId}: ${audioUrl}`);
            return sendJson(res, 200, { success: true, song: db.songs[songIndex] });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 5. Update song lyrics/title from Step 4
    if (req.method === 'POST' && pathname === '/api/update-song') {
        try {
            const { songId, title, originalLyrics } = await getJsonBody(req);
            if (!songId) {
                return sendJson(res, 400, { error: "songId is required." });
            }

            const db = readDb();
            const songIndex = db.songs.findIndex(s => s.id === parseInt(songId));
            if (songIndex === -1) {
                return sendJson(res, 404, { error: "Song not found." });
            }

            db.songs[songIndex].title = title || db.songs[songIndex].title;
            db.songs[songIndex].originalLyrics = originalLyrics || db.songs[songIndex].originalLyrics;
            writeDb(db);

            console.log(`Song ID ${songId} updated with new lyrics/title.`);
            return sendJson(res, 200, { success: true, song: db.songs[songIndex] });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 6. Purchase song confirmation (simulate purchase unlock)
    if (req.method === 'POST' && pathname === '/api/purchase-song') {
        try {
            const { songId } = await getJsonBody(req);
            if (!songId) {
                return sendJson(res, 400, { error: "songId is required." });
            }

            const db = readDb();
            const songIndex = db.songs.findIndex(s => s.id === parseInt(songId));
            if (songIndex === -1) {
                return sendJson(res, 404, { error: "Song not found." });
            }

            db.songs[songIndex].isPurchased = true;
            writeDb(db);

            console.log(`Song ID ${songId} marked as purchased.`);
            return sendJson(res, 200, { success: true, song: db.songs[songIndex] });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // --- STATIC FILES ROUTE ---

    // Default to index.html if request is root
    let filePath = pathname === '/' ? './index.html' : '.' + pathname;
    
    // Prevent directory traversal securely
    const safePath = path.resolve(__dirname, filePath);
    if (!safePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    filePath = safePath;

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // SPA Fallback: serve index.html
                fs.readFile('./index.html', (err, indexContent) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error loading index.html');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(indexContent, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Magic Music Server running on port ${PORT} (Pure Node.js)`);
});
