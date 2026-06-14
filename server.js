const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

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
const STORAGE_PATH = path.join(__dirname, 'storage', 'orders');
const LOGS_PATH = path.join(__dirname, 'logs');

// Ensure runtime directories exist
[STORAGE_PATH, LOGS_PATH, path.join(__dirname, 'backups')].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

// --- V2 STORAGE & PREVIEW HELPERS ---

function generateApprovalToken() {
    return typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString('hex');
}

function getOrderDir(songId) {
    return path.join(STORAGE_PATH, String(songId).padStart(9, '0'));
}

function ensureOrderDir(songId) {
    const dir = getOrderDir(songId);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

async function downloadMp3(url, destPath) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Download falhou: HTTP ${resp.status}`);
    const buf = await resp.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buf));
}

function generatePreview(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        execFile('ffmpeg', ['-y', '-i', inputPath, '-t', '60', '-c', 'copy', outputPath], (err) => {
            if (err) reject(err);
            else resolve(outputPath);
        });
    });
}

function logEvent(type, data) {
    const line = JSON.stringify({ ts: new Date().toISOString(), type, ...data }) + '\n';
    try { fs.appendFileSync(path.join(LOGS_PATH, 'magic-music.log'), line); } catch (_) {}
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
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password'
    });
    res.end(JSON.stringify(data));
}

function isAdminAuthorized(req) {
    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (!configuredPassword) {
        console.warn("ADMIN_PASSWORD is not configured; admin route denied.");
        return false;
    }

    return req.headers['x-admin-password'] === configuredPassword;
}

function getProductionUrl() {
    return process.env.PRODUCTION_ADMIN_URL || "http://magicmusic.5.189.152.8.nip.io";
}

function normalizeOptionalText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeContact(value) {
    return normalizeOptionalText(value).toLowerCase().replace(/[\s().-]/g, "");
}

function toClientSong(song) {
    const isLegacyReady = song.status === 'ready';
    const isDelivered = ['paid', 'delivered'].includes(song.status);
    return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        language: song.language,
        category: song.category,
        coverColorHex: song.coverColorHex,
        originalLyrics: song.originalLyrics,
        translatedLyrics: song.translatedLyrics,
        romanization: song.romanization,
        durationSeconds: song.durationSeconds,
        audioUrl: isLegacyReady
            ? (song.audioUrl || null)
            : (isDelivered && song.approvalToken ? `/api/download/${song.approvalToken}` : null),
        previewUrl: song.previewUrl || null,
        coverUrl: song.coverUrl || null,
        status: song.status || 'pending_audio',
        isPurchased: Boolean(song.isPurchased),
        approvalToken: song.approvalToken || null,
        paymentStatus: song.paymentStatus || null,
        paidAt: song.paidAt || null,
        deliveredAt: song.deliveredAt || null,
        adjustmentHistory: song.adjustmentHistory || [],
        createdAt: song.createdAt || null
    };
}

function buildProductionMessage(song) {
    return [
        "Novo pedido Magic Music para produção",
        "",
        `ID: ${song.id}`,
        `Titulo: ${song.title}`,
        `Artista: ${song.artist}`,
        `Ocasião: ${song.language}`,
        `Estilo: ${song.category}`,
        `Vibe: ${song.romanization || "-"}`,
        "",
        "Contato do cliente:",
        `Nome: ${song.customerName || "-"}`,
        `WhatsApp: ${song.customerWhatsapp || "-"}`,
        `E-mail: ${song.customerEmail || "-"}`,
        `Observações: ${song.customerNotes || "-"}`,
        "",
        `Painel: ${getProductionUrl()}`,
        "",
        "Prompt Suno:",
        song.sunoPrompt || "-",
        "",
        "Letra:",
        song.originalLyrics || "-"
    ].join("\n");
}

async function notifyProductionRequest(song) {
    const token = process.env.MAGIC_MUSIC_TELEGRAM_BOT_TOKEN;
    const chatIds = (process.env.MAGIC_MUSIC_TELEGRAM_CHAT_IDS || process.env.MAGIC_MUSIC_TELEGRAM_CHAT_ID || "")
        .split(",")
        .map(id => id.trim())
        .filter(Boolean);

    if (!token || chatIds.length === 0) {
        console.log(`Magic Music notification skipped for song ID ${song.id}: isolated Telegram vars are not configured.`);
        return false;
    }

    const text = buildProductionMessage(song);
    await Promise.all(chatIds.map(async chatId => {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text
            })
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Telegram notification failed for chat ${chatId}: ${response.status} ${body}`);
        }
    }));

    console.log(`Magic Music production notification sent for song ID ${song.id}.`);
    return true;
}

async function sendTelegramMessage(text) {
    const token = process.env.MAGIC_MUSIC_TELEGRAM_BOT_TOKEN;
    const chatIds = (process.env.MAGIC_MUSIC_TELEGRAM_CHAT_IDS || process.env.MAGIC_MUSIC_TELEGRAM_CHAT_ID || "")
        .split(",").map(id => id.trim()).filter(Boolean);
    if (!token || chatIds.length === 0) return false;
    await Promise.all(chatIds.map(async chatId => {
        const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text })
        });
        if (!resp.ok) throw new Error(`Telegram: ${resp.status} para ${chatId}`);
    }));
    return true;
}

async function notifyPreviewReady(song, approvalUrl) {
    return sendTelegramMessage([
        "🎵 MAGIC MUSIC",
        "",
        `Pedido: ${song.id}`,
        `Cliente: ${song.customerName || "-"}`,
        `Status: Prévia Disponível`,
        "",
        `Título: ${song.title}`,
        `Estilo: ${song.category}`,
        `Ocasião: ${song.language}`,
        "",
        `WhatsApp: ${song.customerWhatsapp || "-"}`,
        `E-mail: ${song.customerEmail || "-"}`,
        "",
        "Link de Aprovação:",
        approvalUrl
    ].join("\n"));
}

async function notifyAdjustmentRequested(song) {
    const last = (song.adjustmentHistory || []).slice(-1)[0];
    return sendTelegramMessage([
        "⚠️ MAGIC MUSIC — Ajuste Solicitado",
        "",
        `Pedido: ${song.id}`,
        `Cliente: ${song.customerName || "-"}`,
        `WhatsApp: ${song.customerWhatsapp || "-"}`,
        "",
        `Título: ${song.title}`,
        `Estilo: ${song.category}`,
        "",
        "Descrição do Ajuste:",
        last?.description || "-"
    ].join("\n"));
}

// Raw binary body reader (for file uploads)
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

// --- ASAAS PAYMENT HELPERS ---

async function asaasRequest(method, endpoint, body) {
    const apiKey = process.env.ASAAS_API_KEY;
    const baseUrl = process.env.ASAAS_BASE_URL || 'https://www.asaas.com/api/v3';
    const resp = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'access_token': apiKey },
        body: body ? JSON.stringify(body) : undefined
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(`Asaas ${resp.status}: ${JSON.stringify(json.errors || json)}`);
    return json;
}

async function getOrCreateAsaasCustomer(song) {
    const name = song.customerName || 'Cliente Magic Music';
    const email = song.customerEmail || null;
    const phone = song.customerWhatsapp ? song.customerWhatsapp.replace(/\D/g, '') : null;
    const cpfCnpj = song.customerCpf || null;

    if (!cpfCnpj) throw new Error('CPF do cliente não informado. Preencha o CPF no pedido.');

    // Busca cliente pelo CPF (garantia de que tem CPF cadastrado)
    const search = await asaasRequest('GET', `/customers?cpfCnpj=${cpfCnpj}&limit=1`);
    if (search.data && search.data.length > 0) return search.data[0].id;

    // Cria novo cliente com CPF
    const payload = { name, cpfCnpj };
    if (email) payload.email = email;
    if (phone) payload.mobilePhone = phone;

    const customer = await asaasRequest('POST', '/customers', payload);
    return customer.id;
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
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password'
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
                previewUrl: null,
                coverUrl: null,
                status: "pending_audio",
                approvalToken: generateApprovalToken(),
                paymentStatus: null,
                paymentProvider: null,
                pixTransactionId: null,
                paidAt: null,
                deliveredAt: null,
                adjustmentHistory: [],
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

    // 3. Admin: Get pending songs (pending_audio + adjustment_requested = need action)
    if (req.method === 'GET' && pathname === '/api/admin/pending') {
        if (!isAdminAuthorized(req)) {
            return sendJson(res, 401, { error: "Unauthorized." });
        }

        const db = readDb();
        const pending = db.songs.filter(s => ['pending_audio', 'adjustment_requested'].includes(s.status));
        return sendJson(res, 200, pending);
    }

    // 4. Client: Search own songs by WhatsApp or email
    if (req.method === 'GET' && pathname === '/api/client/songs') {
        const contact = normalizeContact(parsedUrl.searchParams.get("contact"));
        if (!contact || contact.length < 5) {
            return sendJson(res, 400, { error: "Informe WhatsApp ou e-mail para localizar seus pedidos." });
        }

        const db = readDb();
        const matches = db.songs
            .filter(song => {
                const whatsapp = normalizeContact(song.customerWhatsapp);
                const email = normalizeContact(song.customerEmail);
                return whatsapp === contact || email === contact;
            })
            .map(toClientSong);

        return sendJson(res, 200, matches);
    }

    // 5. Admin: Submit generated audio link (v2.0: download + FFmpeg preview + preview_ready)
    if (req.method === 'POST' && pathname === '/api/admin/submit-audio') {
        if (!isAdminAuthorized(req)) {
            return sendJson(res, 401, { error: "Unauthorized." });
        }

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

            const song = db.songs[songIndex];

            // Ensure approvalToken exists (for songs created before v2.0)
            if (!song.approvalToken) {
                song.approvalToken = generateApprovalToken();
            }
            if (!Array.isArray(song.adjustmentHistory)) song.adjustmentHistory = [];

            const orderDir = ensureOrderDir(song.id);
            const musicaPath = path.join(orderDir, 'musica.mp3');
            const previewPath = path.join(orderDir, 'preview.mp3');

            let previewGenerated = false;
            let downloadedLocally = false;

            try {
                await downloadMp3(audioUrl, musicaPath);
                downloadedLocally = true;
                logEvent('mp3_downloaded', { songId: song.id });
            } catch (dlErr) {
                console.error(`MP3 download failed for song ${song.id}:`, dlErr.message);
                logEvent('download_error', { songId: song.id, error: dlErr.message });
            }

            if (downloadedLocally) {
                try {
                    await generatePreview(musicaPath, previewPath);
                    previewGenerated = true;
                    logEvent('preview_generated', { songId: song.id });
                } catch (ffmpegErr) {
                    console.error(`FFmpeg failed for song ${song.id}:`, ffmpegErr.message);
                    logEvent('ffmpeg_error', { songId: song.id, error: ffmpegErr.message });
                }
            }

            song.audioUrl = audioUrl;
            song.status = 'preview_ready';
            song.isPurchased = false;
            song.previewUrl = previewGenerated
                ? `/api/preview/${song.approvalToken}`
                : audioUrl;

            db.songs[songIndex] = song;
            writeDb(db);

            const baseUrl = getProductionUrl();
            const approvalUrl = `${baseUrl}/pedido/${song.approvalToken}`;

            try {
                await notifyPreviewReady(song, approvalUrl);
            } catch (notifyErr) {
                console.error('Preview notification failed:', notifyErr.message);
            }

            logEvent('preview_ready', { songId: song.id, previewGenerated, downloadedLocally });
            console.log(`Song ${songId} → preview_ready. preview gerado: ${previewGenerated}`);

            return sendJson(res, 200, {
                success: true,
                song: db.songs[songIndex],
                previewGenerated,
                approvalUrl
            });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 6. Update song lyrics/title from Step 4
    if (req.method === 'POST' && pathname === '/api/update-song') {
        try {
            const { songId, title, originalLyrics, customerName, customerWhatsapp, customerCpf, customerEmail, customerNotes } = await getJsonBody(req);
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
            db.songs[songIndex].customerName = normalizeOptionalText(customerName);
            db.songs[songIndex].customerWhatsapp = normalizeOptionalText(customerWhatsapp);
            db.songs[songIndex].customerCpf = normalizeOptionalText(customerCpf).replace(/\D/g, '');
            db.songs[songIndex].customerEmail = normalizeOptionalText(customerEmail);
            db.songs[songIndex].customerNotes = normalizeOptionalText(customerNotes);
            db.songs[songIndex].status = db.songs[songIndex].status || "pending_audio";

            if (db.songs[songIndex].status === "pending_audio" && !db.songs[songIndex].productionNotifiedAt) {
                try {
                    const notified = await notifyProductionRequest(db.songs[songIndex]);
                    if (notified) {
                        db.songs[songIndex].productionNotifiedAt = new Date().toISOString();
                    }
                } catch (notifyError) {
                    console.error("Production notification failed:", notifyError);
                }
            }

            writeDb(db);

            console.log(`Song ID ${songId} updated with new lyrics/title.`);
            return sendJson(res, 200, { success: true, song: db.songs[songIndex] });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 7. Register production request from local fallback generator
    if (req.method === 'POST' && pathname === '/api/production-request') {
        try {
            const { title, artist, language, category, coverColorHex, originalLyrics, romanization, durationSeconds, sunoPrompt, customerName, customerWhatsapp, customerCpf, customerEmail, customerNotes } = await getJsonBody(req);
            if (!title || !originalLyrics) {
                return sendJson(res, 400, { error: "title and originalLyrics are required." });
            }

            const db = readDb();
            const newSong = {
                id: db.songs.length > 0 ? Math.max(...db.songs.map(s => s.id)) + 1 : 1,
                title,
                artist: artist || "Magic Music AI",
                language: language || "Geral",
                category: category || "Pop",
                coverColorHex: coverColorHex || "0xFFF43F5E",
                originalLyrics,
                translatedLyrics: "Letra aprovada. Áudio final aguardando produção em estúdio.",
                romanization: romanization || "",
                durationSeconds: durationSeconds || 120,
                sunoPrompt: sunoPrompt || "pop, portuguese vocals, personalized song",
                customerName: normalizeOptionalText(customerName),
                customerWhatsapp: normalizeOptionalText(customerWhatsapp),
                customerCpf: normalizeOptionalText(customerCpf).replace(/\D/g, ''),
                customerEmail: normalizeOptionalText(customerEmail),
                customerNotes: normalizeOptionalText(customerNotes),
                audioUrl: null,
                previewUrl: null,
                coverUrl: null,
                status: "pending_audio",
                approvalToken: generateApprovalToken(),
                paymentStatus: null,
                paymentProvider: null,
                pixTransactionId: null,
                paidAt: null,
                deliveredAt: null,
                adjustmentHistory: [],
                isPurchased: false,
                isFavorite: false,
                createdAt: new Date().toISOString()
            };

            try {
                const notified = await notifyProductionRequest(newSong);
                if (notified) {
                    newSong.productionNotifiedAt = new Date().toISOString();
                }
            } catch (notifyError) {
                console.error("Production notification failed:", notifyError);
            }

            db.songs.push(newSong);
            writeDb(db);

            console.log(`Production request saved. ID: ${newSong.id}`);
            return sendJson(res, 200, { success: true, song: newSong });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 8. Purchase song confirmation (simulate purchase unlock)
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

    // 9. Admin: All orders with optional status filter
    if (req.method === 'GET' && pathname === '/api/admin/orders') {
        if (!isAdminAuthorized(req)) return sendJson(res, 401, { error: "Unauthorized." });
        const filter = parsedUrl.searchParams.get('status');
        const db = readDb();
        const orders = filter && filter !== 'all'
            ? db.songs.filter(s => s.status === filter)
            : db.songs;
        return sendJson(res, 200, orders.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    }

    // 10. Get order by approval token (public)
    if (req.method === 'GET' && pathname.startsWith('/api/order/') &&
        !pathname.startsWith('/api/order/approve') &&
        !pathname.startsWith('/api/order/request-adjustment')) {
        const token = pathname.replace('/api/order/', '');
        if (!token) return sendJson(res, 400, { error: "Token obrigatório." });
        const db = readDb();
        const song = db.songs.find(s => s.approvalToken === token);
        if (!song) return sendJson(res, 404, { error: "Pedido não encontrado." });
        return sendJson(res, 200, toClientSong(song));
    }

    // 11. Approve order (public, by token)
    if (req.method === 'POST' && pathname === '/api/order/approve') {
        try {
            const { token } = await getJsonBody(req);
            if (!token) return sendJson(res, 400, { error: "Token obrigatório." });
            const db = readDb();
            const idx = db.songs.findIndex(s => s.approvalToken === token);
            if (idx === -1) return sendJson(res, 404, { error: "Pedido não encontrado." });
            const song = db.songs[idx];
            if (!['preview_ready', 'adjustment_requested'].includes(song.status)) {
                return sendJson(res, 400, { error: `Status atual não permite aprovação: ${song.status}` });
            }
            song.status = 'awaiting_payment';
            db.songs[idx] = song;
            writeDb(db);
            logEvent('order_approved', { songId: song.id });
            return sendJson(res, 200, { success: true, status: 'awaiting_payment' });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 12. Request adjustment (public, by token)
    if (req.method === 'POST' && pathname === '/api/order/request-adjustment') {
        try {
            const { token, description } = await getJsonBody(req);
            if (!token || !description) return sendJson(res, 400, { error: "Token e descrição são obrigatórios." });
            const db = readDb();
            const idx = db.songs.findIndex(s => s.approvalToken === token);
            if (idx === -1) return sendJson(res, 404, { error: "Pedido não encontrado." });
            const song = db.songs[idx];
            song.status = 'adjustment_requested';
            if (!Array.isArray(song.adjustmentHistory)) song.adjustmentHistory = [];
            song.adjustmentHistory.push({ description: description.trim(), requestedAt: new Date().toISOString() });
            db.songs[idx] = song;
            writeDb(db);
            logEvent('adjustment_requested', { songId: song.id });
            try { await notifyAdjustmentRequested(song); } catch (_) {}
            return sendJson(res, 200, { success: true, status: 'adjustment_requested' });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 13. Serve preview.mp3 by token
    if (req.method === 'GET' && pathname.startsWith('/api/preview/')) {
        const token = pathname.replace('/api/preview/', '');
        if (!token) return sendJson(res, 400, { error: "Token obrigatório." });
        const db = readDb();
        const song = db.songs.find(s => s.approvalToken === token);
        if (!song) return sendJson(res, 404, { error: "Not found." });
        const previewPath = path.join(getOrderDir(song.id), 'preview.mp3');
        if (fs.existsSync(previewPath)) {
            const stat = fs.statSync(previewPath);
            res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
            fs.createReadStream(previewPath).pipe(res);
            return;
        }
        // Fallback: redirect to original Suno URL
        if (song.audioUrl && song.audioUrl.startsWith('http')) {
            res.writeHead(302, { Location: song.audioUrl });
            res.end();
            return;
        }
        return sendJson(res, 404, { error: "Prévia não disponível." });
    }

    // 14. Download full musica.mp3 by token (only if paid or delivered)
    if (req.method === 'GET' && pathname.startsWith('/api/download/')) {
        const token = pathname.replace('/api/download/', '');
        if (!token) return sendJson(res, 400, { error: "Token obrigatório." });
        const db = readDb();
        const song = db.songs.find(s => s.approvalToken === token);
        if (!song) return sendJson(res, 404, { error: "Not found." });
        if (!['paid', 'delivered'].includes(song.status)) {
            return sendJson(res, 403, { error: "Música ainda não disponível para download." });
        }
        const musicaPath = path.join(getOrderDir(song.id), 'musica.mp3');
        if (fs.existsSync(musicaPath)) {
            const safeTitle = (song.title || 'musica').replace(/[^\w\sÀ-ÿ-]/g, '').trim().replace(/\s+/g, '_');
            const stat = fs.statSync(musicaPath);
            res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': stat.size, 'Content-Disposition': `attachment; filename="${safeTitle}.mp3"`, 'Accept-Ranges': 'bytes' });
            fs.createReadStream(musicaPath).pipe(res);
            return;
        }
        // Fallback to original URL
        if (song.audioUrl && song.audioUrl.startsWith('http')) {
            res.writeHead(302, { Location: song.audioUrl });
            res.end();
            return;
        }
        return sendJson(res, 404, { error: "Arquivo não encontrado." });
    }

    // 15. Admin: upload MP3 direto do computador
    if (req.method === 'POST' && pathname === '/api/admin/upload-audio') {
        if (!isAdminAuthorized(req)) return sendJson(res, 401, { error: 'Unauthorized.' });

        try {
            const songId = parseInt(req.headers['x-song-id']);
            if (!songId) return sendJson(res, 400, { error: 'Header X-Song-Id obrigatório.' });

            const db = readDb();
            const songIndex = db.songs.findIndex(s => s.id === songId);
            if (songIndex === -1) return sendJson(res, 404, { error: 'Song not found.' });

            const song = db.songs[songIndex];
            if (!song.approvalToken) song.approvalToken = generateApprovalToken();
            if (!Array.isArray(song.adjustmentHistory)) song.adjustmentHistory = [];

            const buffer = await getRawBody(req);
            if (buffer.length < 1024) return sendJson(res, 400, { error: 'Arquivo muito pequeno ou inválido.' });

            const orderDir = ensureOrderDir(song.id);
            const musicaPath = path.join(orderDir, 'musica.mp3');
            const previewPath = path.join(orderDir, 'preview.mp3');

            fs.writeFileSync(musicaPath, buffer);
            logEvent('mp3_uploaded', { songId: song.id, bytes: buffer.length });

            let previewGenerated = false;
            try {
                await generatePreview(musicaPath, previewPath);
                previewGenerated = true;
                logEvent('preview_generated', { songId: song.id });
            } catch (ffmpegErr) {
                console.error(`FFmpeg error for song ${song.id}:`, ffmpegErr.message);
                logEvent('ffmpeg_error', { songId: song.id, error: ffmpegErr.message });
            }

            song.audioUrl = `/api/download/${song.approvalToken}`;
            song.status = 'preview_ready';
            song.isPurchased = false;
            song.previewUrl = previewGenerated
                ? `/api/preview/${song.approvalToken}`
                : `/api/download/${song.approvalToken}`;

            db.songs[songIndex] = song;
            writeDb(db);

            const baseUrl = getProductionUrl();
            const approvalUrl = `${baseUrl}/pedido/${song.approvalToken}`;

            try { await notifyPreviewReady(song, approvalUrl); } catch (_) {}

            logEvent('preview_ready', { songId: song.id, previewGenerated, source: 'upload' });

            return sendJson(res, 200, { success: true, song: db.songs[songIndex], previewGenerated, approvalUrl });
        } catch (e) {
            console.error('Upload error:', e.message);
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 16. Create PIX payment via Asaas
    if (req.method === 'POST' && pathname === '/api/payment/create') {
        try {
            const { token } = await getJsonBody(req);
            if (!token) return sendJson(res, 400, { error: "Token obrigatório." });

            const db = readDb();
            const idx = db.songs.findIndex(s => s.approvalToken === token);
            if (idx === -1) return sendJson(res, 404, { error: "Pedido não encontrado." });

            const song = db.songs[idx];
            if (song.status !== 'awaiting_payment') {
                return sendJson(res, 400, { error: `Status atual não permite pagamento: ${song.status}` });
            }

            if (!process.env.ASAAS_API_KEY) {
                return sendJson(res, 500, { error: "Gateway de pagamento não configurado." });
            }

            const price = parseFloat(process.env.MAGIC_MUSIC_PRICE || '49.90');

            const customerId = await getOrCreateAsaasCustomer(song);

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 1);
            const dueDateStr = dueDate.toISOString().split('T')[0];

            const payment = await asaasRequest('POST', '/payments', {
                customer: customerId,
                billingType: 'PIX',
                value: price,
                dueDate: dueDateStr,
                description: `Magic Music - ${song.title || 'Pedido ' + song.id}`,
                externalReference: String(song.id)
            });

            const qrCode = await asaasRequest('GET', `/payments/${payment.id}/pixQrCode`);

            song.pixTransactionId = payment.id;
            song.paymentProvider = 'asaas';
            db.songs[idx] = song;
            writeDb(db);
            logEvent('payment_created', { songId: song.id, paymentId: payment.id });

            return sendJson(res, 200, {
                success: true,
                paymentId: payment.id,
                value: price,
                dueDate: dueDateStr,
                pix: {
                    qrCodeImage: qrCode.encodedImage,
                    copyPaste: qrCode.payload,
                    expirationDate: qrCode.expirationDate
                }
            });
        } catch (e) {
            console.error('Payment create error:', e.message);
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 16. Asaas PIX webhook (PAYMENT_RECEIVED / PAYMENT_CONFIRMED)
    if (req.method === 'POST' && pathname === '/api/payment/webhook') {
        try {
            const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
            if (webhookToken) {
                const received = req.headers['asaas-access-token'];
                if (received !== webhookToken) {
                    logEvent('webhook_unauthorized', { ip: req.socket.remoteAddress });
                    return sendJson(res, 401, { error: 'Unauthorized' });
                }
            }

            const body = await getJsonBody(req);
            const { event, payment } = body;

            logEvent('webhook_received', { event, paymentId: payment?.id });

            if (!['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event)) {
                return sendJson(res, 200, { ok: true, skipped: event });
            }

            if (!payment?.id) {
                return sendJson(res, 400, { error: 'payment.id ausente no payload' });
            }

            const db = readDb();
            const idx = db.songs.findIndex(s => s.pixTransactionId === payment.id);
            if (idx === -1) {
                logEvent('webhook_song_not_found', { paymentId: payment.id });
                return sendJson(res, 200, { ok: true, notFound: true });
            }

            const song = db.songs[idx];

            if (['paid', 'delivered'].includes(song.status)) {
                return sendJson(res, 200, { ok: true, alreadyProcessed: true });
            }

            const now = new Date().toISOString();
            song.paymentStatus = 'paid';
            song.paidAt = now;
            song.status = 'delivered';
            song.deliveredAt = now;
            db.songs[idx] = song;
            writeDb(db);

            logEvent('payment_confirmed', { songId: song.id, paymentId: payment.id });

            try {
                await sendTelegramMessage([
                    '💰 MAGIC MUSIC — Pagamento Confirmado',
                    '',
                    `Pedido: ${song.id}`,
                    `Música: ${song.title}`,
                    `Cliente: ${song.customerName || '-'}`,
                    `WhatsApp: ${song.customerWhatsapp || '-'}`,
                    '',
                    'Download liberado automaticamente!'
                ].join('\n'));
            } catch (_) {}

            return sendJson(res, 200, { ok: true, songId: song.id, status: 'delivered' });
        } catch (e) {
            console.error('Webhook error:', e.message);
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
