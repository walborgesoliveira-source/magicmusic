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

const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.MAGIC_MUSIC_DB_HOST || 'magic_music_db',
    port:     parseInt(process.env.MAGIC_MUSIC_DB_PORT || '5432'),
    database: process.env.MAGIC_MUSIC_DB_NAME || 'magic_music',
    user:     process.env.MAGIC_MUSIC_DB_USER || 'magic_music_user',
    password: process.env.MAGIC_MUSIC_DB_PASSWORD || '',
});

// Helper: converte row do postgres (snake_case) para objeto song (camelCase)
function rowToSong(row) {
    return {
        id:                     row.id,
        title:                  row.title,
        artist:                 row.artist,
        language:               row.language,
        category:               row.category,
        coverColorHex:          row.cover_color_hex,
        originalLyrics:         row.original_lyrics,
        translatedLyrics:       row.translated_lyrics,
        romanization:           row.romanization,
        durationSeconds:        row.duration_seconds,
        sunoPrompt:             row.suno_prompt,
        customerName:           row.customer_name,
        customerWhatsapp:       row.customer_whatsapp,
        customerCpf:            row.customer_cpf,
        customerEmail:          row.customer_email,
        customerNotes:          row.customer_notes,
        audioUrl:               row.audio_url,
        previewUrl:             row.preview_url,
        coverUrl:               row.cover_url,
        status:                 row.status,
        approvalToken:          row.approval_token,
        paymentStatus:          row.payment_status,
        paymentProvider:        row.payment_provider,
        pixTransactionId:       row.pix_transaction_id,
        paidAt:                 row.paid_at,
        deliveredAt:            row.delivered_at,
        adjustmentHistory:      row.adjustment_history || [],
        isFavorite:             row.is_favorite,
        isPurchased:            row.is_purchased,
        productionNotifiedAt:   row.production_notified_at,
        createdAt:              row.created_at,
    };
}

const PORT = process.env.PORT || 3000;
const STORAGE_PATH = path.join(__dirname, 'storage', 'orders');
const LOGS_PATH = path.join(__dirname, 'logs');

// Ensure runtime directories exist
[STORAGE_PATH, LOGS_PATH, path.join(__dirname, 'backups')].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

            const result = await pool.query(`
                INSERT INTO songs (title, artist, language, category, cover_color_hex, original_lyrics,
                    translated_lyrics, romanization, duration_seconds, suno_prompt,
                    approval_token, status, created_at)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending_audio',NOW())
                RETURNING *`,
                [
                    parsedJson.title || `Canção para ${name}`,
                    parsedJson.artist || `Magic Music AI & ${name}`,
                    occasion || 'Geral',
                    style || 'Pop',
                    randomColor,
                    parsedJson.lyrics || '',
                    'Sincronizada via TTS. Gênero: ' + style,
                    vibesText,
                    parsedJson.durationSeconds || 120,
                    parsedJson.sunoPrompt || 'pop, male vocals',
                    generateApprovalToken(),
                ]
            );
            const newSong = rowToSong(result.rows[0]);

            console.log(`Lyrics generated and song saved. ID: ${newSong.id}`);
            return sendJson(res, 200, newSong);

        } catch (error) {
            console.error("Error in generate-lyrics:", error);
            return sendJson(res, 500, { error: "Failed to generate song lyrics. " + error.message });
        }
    }

    // 2. Fetch all songs (admin)
    if (req.method === 'GET' && pathname === '/api/songs') {
        if (!isAdminAuthorized(req)) return sendJson(res, 401, { error: "Unauthorized." });
        try {
            const result = await pool.query('SELECT * FROM songs ORDER BY id DESC');
            return sendJson(res, 200, result.rows.map(rowToSong));
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 3. Admin: Get pending songs (pending_audio + adjustment_requested = need action)
    if (req.method === 'GET' && pathname === '/api/admin/pending') {
        if (!isAdminAuthorized(req)) {
            return sendJson(res, 401, { error: "Unauthorized." });
        }
        try {
            const result = await pool.query(`SELECT * FROM songs WHERE status IN ('pending_audio','adjustment_requested') ORDER BY id DESC`);
            return sendJson(res, 200, result.rows.map(rowToSong));
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 4. Client: Search own songs by WhatsApp or email
    if (req.method === 'GET' && pathname === '/api/client/songs') {
        const contact = normalizeContact(parsedUrl.searchParams.get("contact"));
        if (!contact || contact.length < 5) {
            return sendJson(res, 400, { error: "Informe WhatsApp ou e-mail para localizar seus pedidos." });
        }

        try {
            const result = await pool.query(`
                SELECT * FROM songs
                WHERE REGEXP_REPLACE(LOWER(customer_whatsapp), '[\\s().\\-]', '', 'g') = $1
                   OR REGEXP_REPLACE(LOWER(customer_email), '[\\s().\\-]', '', 'g') = $1
                ORDER BY id DESC`,
                [contact]
            );
            return sendJson(res, 200, result.rows.map(rowToSong).map(toClientSong));
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

            const result = await pool.query(`
                UPDATE songs SET
                    title = COALESCE(NULLIF($1,''), title),
                    original_lyrics = COALESCE(NULLIF($2,''), original_lyrics),
                    customer_name = $3,
                    customer_whatsapp = $4,
                    customer_cpf = $5,
                    customer_email = $6,
                    customer_notes = $7
                WHERE id = $8 RETURNING *`,
                [
                    title,
                    originalLyrics,
                    normalizeOptionalText(customerName),
                    normalizeOptionalText(customerWhatsapp),
                    normalizeOptionalText(customerCpf).replace(/\D/g, ''),
                    normalizeOptionalText(customerEmail),
                    normalizeOptionalText(customerNotes),
                    parseInt(songId)
                ]
            );
            if (result.rows.length === 0) {
                return sendJson(res, 404, { error: "Song not found." });
            }

            let song = rowToSong(result.rows[0]);

            if (song.status === 'pending_audio' && !song.productionNotifiedAt) {
                try {
                    const notified = await notifyProductionRequest(song);
                    if (notified) {
                        await pool.query('UPDATE songs SET production_notified_at=NOW() WHERE id=$1', [song.id]);
                        song.productionNotifiedAt = new Date().toISOString();
                    }
                } catch (notifyError) {
                    console.error("Production notification failed:", notifyError);
                }
            }

            console.log(`Song ID ${songId} updated with new lyrics/title.`);
            return sendJson(res, 200, { success: true, song });
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

            const insertResult = await pool.query(`
                INSERT INTO songs (title, artist, language, category, cover_color_hex, original_lyrics,
                    translated_lyrics, romanization, duration_seconds, suno_prompt,
                    customer_name, customer_whatsapp, customer_cpf, customer_email, customer_notes,
                    status, approval_token, created_at)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending_audio',$16,NOW())
                RETURNING *`,
                [
                    title,
                    artist || 'Magic Music AI',
                    language || 'Geral',
                    category || 'Pop',
                    coverColorHex || '0xFFF43F5E',
                    originalLyrics,
                    'Letra aprovada. Áudio final aguardando produção em estúdio.',
                    romanization || '',
                    durationSeconds || 120,
                    sunoPrompt || 'pop, portuguese vocals, personalized song',
                    normalizeOptionalText(customerName),
                    normalizeOptionalText(customerWhatsapp),
                    normalizeOptionalText(customerCpf).replace(/\D/g, ''),
                    normalizeOptionalText(customerEmail),
                    normalizeOptionalText(customerNotes),
                    generateApprovalToken(),
                ]
            );
            let newSong = rowToSong(insertResult.rows[0]);

            try {
                const notified = await notifyProductionRequest(newSong);
                if (notified) {
                    await pool.query('UPDATE songs SET production_notified_at=NOW() WHERE id=$1', [newSong.id]);
                    newSong.productionNotifiedAt = new Date().toISOString();
                }
            } catch (notifyError) {
                console.error("Production notification failed:", notifyError);
            }

            console.log(`Production request saved. ID: ${newSong.id}`);
            return sendJson(res, 200, { success: true, song: newSong });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 8b. Admin: CRM — lista de clientes únicos com totais
    if (req.method === 'GET' && pathname === '/api/admin/customers') {
        if (!isAdminAuthorized(req)) return sendJson(res, 401, { error: 'Unauthorized.' });
        try {
            const result = await pool.query(`
                SELECT
                    REGEXP_REPLACE(LOWER(customer_whatsapp), '[\\s().\\-]', '', 'g') AS whatsapp_key,
                    MAX(customer_name)      AS name,
                    MAX(customer_whatsapp)  AS whatsapp,
                    MAX(customer_email)     AS email,
                    MAX(customer_cpf)       AS cpf,
                    COUNT(*)                AS total_orders,
                    COUNT(*) FILTER (WHERE status IN ('paid','delivered')) AS paid_orders,
                    MAX(created_at)         AS last_order_at
                FROM songs
                WHERE customer_whatsapp != '' OR customer_email != ''
                GROUP BY whatsapp_key
                ORDER BY last_order_at DESC
            `);
            return sendJson(res, 200, result.rows);
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 9. Admin: All orders with optional status filter
    if (req.method === 'GET' && pathname === '/api/admin/orders') {
        if (!isAdminAuthorized(req)) return sendJson(res, 401, { error: "Unauthorized." });
        try {
            const filter = parsedUrl.searchParams.get('status');
            const result = filter && filter !== 'all'
                ? await pool.query('SELECT * FROM songs WHERE status=$1 ORDER BY id DESC', [filter])
                : await pool.query('SELECT * FROM songs ORDER BY id DESC');
            return sendJson(res, 200, result.rows.map(rowToSong));
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 10. Get order by approval token (public)
    if (req.method === 'GET' && pathname.startsWith('/api/order/') &&
        !pathname.startsWith('/api/order/approve') &&
        !pathname.startsWith('/api/order/request-adjustment')) {
        const token = pathname.replace('/api/order/', '');
        if (!token) return sendJson(res, 400, { error: "Token obrigatório." });
        try {
            const result = await pool.query('SELECT * FROM songs WHERE approval_token=$1', [token]);
            if (result.rows.length === 0) return sendJson(res, 404, { error: "Pedido não encontrado." });
            return sendJson(res, 200, toClientSong(rowToSong(result.rows[0])));
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 11. Approve order (public, by token)
    if (req.method === 'POST' && pathname === '/api/order/approve') {
        try {
            const { token } = await getJsonBody(req);
            if (!token) return sendJson(res, 400, { error: "Token obrigatório." });

            // Busca para validar status atual
            const songRes = await pool.query('SELECT * FROM songs WHERE approval_token=$1', [token]);
            if (songRes.rows.length === 0) return sendJson(res, 404, { error: "Pedido não encontrado." });
            const song = rowToSong(songRes.rows[0]);
            if (!['preview_ready', 'adjustment_requested'].includes(song.status)) {
                return sendJson(res, 400, { error: `Status atual não permite aprovação: ${song.status}` });
            }

            const result = await pool.query(`
                UPDATE songs SET status='awaiting_payment' WHERE approval_token=$1
                RETURNING *`, [token]
            );
            logEvent('order_approved', { songId: result.rows[0].id });
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

            const songRes = await pool.query('SELECT * FROM songs WHERE approval_token=$1', [token]);
            if (songRes.rows.length === 0) return sendJson(res, 404, { error: "Pedido não encontrado." });
            const song = rowToSong(songRes.rows[0]);
            const history = Array.isArray(song.adjustmentHistory) ? song.adjustmentHistory : [];
            history.push({ description: description.trim(), requestedAt: new Date().toISOString() });

            const upd = await pool.query(`
                UPDATE songs SET status='adjustment_requested', adjustment_history=$1::jsonb
                WHERE approval_token=$2 RETURNING *`,
                [JSON.stringify(history), token]
            );
            const updSong = rowToSong(upd.rows[0]);
            logEvent('adjustment_requested', { songId: updSong.id });
            try { await notifyAdjustmentRequested(updSong); } catch (_) {}
            return sendJson(res, 200, { success: true, status: 'adjustment_requested' });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 13. Serve preview.mp3 by token
    if (req.method === 'GET' && pathname.startsWith('/api/preview/')) {
        const token = pathname.replace('/api/preview/', '');
        if (!token) return sendJson(res, 400, { error: "Token obrigatório." });
        try {
            const result = await pool.query('SELECT id, audio_url FROM songs WHERE approval_token=$1', [token]);
            if (result.rows.length === 0) return sendJson(res, 404, { error: "Not found." });
            const row = result.rows[0];
            const previewPath = path.join(getOrderDir(row.id), 'preview.mp3');
            if (fs.existsSync(previewPath)) {
                const stat = fs.statSync(previewPath);
                res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
                fs.createReadStream(previewPath).pipe(res);
                return;
            }
            // Fallback: redirect to original Suno URL
            if (row.audio_url && row.audio_url.startsWith('http')) {
                res.writeHead(302, { Location: row.audio_url });
                res.end();
                return;
            }
            return sendJson(res, 404, { error: "Prévia não disponível." });
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 14. Download full musica.mp3 by token (only if paid or delivered)
    if (req.method === 'GET' && pathname.startsWith('/api/download/')) {
        const token = pathname.replace('/api/download/', '');
        if (!token) return sendJson(res, 400, { error: "Token obrigatório." });
        try {
            const result = await pool.query('SELECT * FROM songs WHERE approval_token=$1', [token]);
            if (result.rows.length === 0) return sendJson(res, 404, { error: "Not found." });
            const song = rowToSong(result.rows[0]);
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
        } catch (e) {
            return sendJson(res, 500, { error: e.message });
        }
    }

    // 15. Admin: upload MP3 direto do computador
    if (req.method === 'POST' && pathname === '/api/admin/upload-audio') {
        if (!isAdminAuthorized(req)) return sendJson(res, 401, { error: 'Unauthorized.' });

        try {
            const songId = parseInt(req.headers['x-song-id']);
            if (!songId) return sendJson(res, 400, { error: 'Header X-Song-Id obrigatório.' });

            const songRes = await pool.query('SELECT * FROM songs WHERE id=$1', [songId]);
            if (songRes.rows.length === 0) return sendJson(res, 404, { error: 'Song not found.' });

            let song = rowToSong(songRes.rows[0]);

            // Ensure approvalToken exists
            if (!song.approvalToken) {
                const newToken = generateApprovalToken();
                await pool.query('UPDATE songs SET approval_token=$1 WHERE id=$2', [newToken, song.id]);
                song.approvalToken = newToken;
            }

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

            const audioRelPath = `/api/download/${song.approvalToken}`;
            const previewRelPath = previewGenerated
                ? `/api/preview/${song.approvalToken}`
                : `/api/download/${song.approvalToken}`;

            await pool.query(`
                UPDATE songs SET audio_url=$1, preview_url=$2, status='preview_ready', is_purchased=false
                WHERE id=$3`,
                [audioRelPath, previewRelPath, song.id]
            );
            const upd = await pool.query('SELECT * FROM songs WHERE id=$1', [song.id]);
            song = rowToSong(upd.rows[0]);

            const baseUrl = getProductionUrl();
            const approvalUrl = `${baseUrl}/pedido/${song.approvalToken}`;

            try { await notifyPreviewReady(song, approvalUrl); } catch (_) {}

            logEvent('preview_ready', { songId: song.id, previewGenerated, source: 'upload' });

            return sendJson(res, 200, { success: true, song, previewGenerated, approvalUrl });
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

            const songRes = await pool.query('SELECT * FROM songs WHERE approval_token=$1', [token]);
            if (songRes.rows.length === 0) return sendJson(res, 404, { error: "Pedido não encontrado." });

            const song = rowToSong(songRes.rows[0]);
            if (song.status !== 'awaiting_payment') {
                return sendJson(res, 400, { error: `Status atual não permite pagamento: ${song.status}` });
            }

            if (!process.env.ASAAS_API_KEY) {
                return sendJson(res, 500, { error: "Gateway de pagamento não configurado." });
            }

            const defaultCustomerId = process.env.ASAAS_DEFAULT_CUSTOMER_ID;
            if (!defaultCustomerId) {
                return sendJson(res, 500, { error: "ASAAS_DEFAULT_CUSTOMER_ID não configurado no servidor." });
            }

            const price = parseFloat(process.env.MAGIC_MUSIC_PRICE || '49.90');
            const customerId = defaultCustomerId;

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

            await pool.query(`UPDATE songs SET pix_transaction_id=$1, payment_provider='asaas' WHERE id=$2`,
                [payment.id, song.id]);
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

    // 17. Asaas PIX webhook (PAYMENT_RECEIVED / PAYMENT_CONFIRMED)
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

            // Verifica se já foi processado
            const checkRes = await pool.query('SELECT * FROM songs WHERE pix_transaction_id=$1', [payment.id]);
            if (checkRes.rows.length === 0) {
                logEvent('webhook_song_not_found', { paymentId: payment.id });
                return sendJson(res, 200, { ok: true, notFound: true });
            }
            const existing = rowToSong(checkRes.rows[0]);
            if (['paid', 'delivered'].includes(existing.status)) {
                return sendJson(res, 200, { ok: true, alreadyProcessed: true });
            }

            await pool.query(`
                UPDATE songs SET status='delivered', paid_at=NOW(), delivered_at=NOW(),
                    payment_status='paid'
                WHERE pix_transaction_id=$1`,
                [payment.id]
            );

            const songRes = await pool.query('SELECT * FROM songs WHERE pix_transaction_id=$1', [payment.id]);
            const song = rowToSong(songRes.rows[0]);

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
