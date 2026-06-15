#!/usr/bin/env node
// Migração db.json → PostgreSQL
// Preserva IDs originais. Gera approvalToken para registros sem um.
// Execute: node scripts/migrate-db-json.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

// Carrega .env manualmente
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eq = trimmed.indexOf('=');
            if (eq > 0) {
                const key = trimmed.substring(0, eq).trim();
                let val = trimmed.substring(eq + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
                    val = val.slice(1, -1);
                process.env[key] = val;
            }
        }
    });
}

const pool = new Pool({
    host:     process.env.MAGIC_MUSIC_DB_HOST || 'localhost',
    port:     parseInt(process.env.MAGIC_MUSIC_DB_PORT || '5432'),
    database: process.env.MAGIC_MUSIC_DB_NAME || 'magic_music',
    user:     process.env.MAGIC_MUSIC_DB_USER || 'magic_music_user',
    password: process.env.MAGIC_MUSIC_DB_PASSWORD || '',
});

function genToken() {
    return typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString('hex');
}

function str(v) { return typeof v === 'string' ? v.trim() : (v != null ? String(v) : ''); }
function nullable(v) { return (v != null && v !== '') ? v : null; }

async function migrate() {
    const dbJsonPath = path.join(__dirname, '..', 'db.json');
    if (!fs.existsSync(dbJsonPath)) {
        console.error('db.json não encontrado em', dbJsonPath);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
    const songs = data.songs || [];
    console.log(`\n=== Migração db.json → PostgreSQL ===`);
    console.log(`Registros a migrar: ${songs.length}\n`);

    let migrated = 0, skipped = 0, errors = 0;

    for (const s of songs) {
        try {
            // Verifica se ID já existe no PG
            const exists = await pool.query('SELECT id FROM songs WHERE id=$1', [s.id]);
            if (exists.rows.length > 0) {
                console.log(`  SKIP   ID ${s.id} — já existe no PostgreSQL`);
                skipped++;
                continue;
            }

            const token = s.approvalToken || genToken();

            // Mapeamento de status legado
            let status = s.status || 'pending_audio';
            // 'ready' é tratado como legado pelo server; mantém para retrocompatibilidade

            await pool.query(`
                INSERT INTO songs (
                    id, title, artist, language, category, cover_color_hex,
                    original_lyrics, translated_lyrics, romanization,
                    duration_seconds, suno_prompt,
                    customer_name, customer_whatsapp, customer_cpf,
                    customer_email, customer_notes,
                    audio_url, preview_url, cover_url,
                    status, approval_token,
                    payment_status, payment_provider, pix_transaction_id,
                    paid_at, delivered_at,
                    adjustment_history, is_favorite, is_purchased,
                    production_notified_at, created_at
                ) OVERRIDING SYSTEM VALUE VALUES (
                    $1,$2,$3,$4,$5,$6,
                    $7,$8,$9,
                    $10,$11,
                    $12,$13,$14,
                    $15,$16,
                    $17,$18,$19,
                    $20,$21,
                    $22,$23,$24,
                    $25,$26,
                    $27::jsonb,$28,$29,
                    $30,$31
                )`,
                [
                    s.id,
                    str(s.title) || 'Sem título',
                    str(s.artist) || 'Magic Music AI',
                    str(s.language) || 'Geral',
                    str(s.category) || 'Pop',
                    str(s.coverColorHex) || '0xFFF43F5E',
                    str(s.originalLyrics),
                    str(s.translatedLyrics),
                    str(s.romanization),
                    s.durationSeconds || 120,
                    str(s.sunoPrompt),
                    str(s.customerName),
                    str(s.customerWhatsapp),
                    str(s.customerCpf || '').replace(/\D/g, ''),
                    str(s.customerEmail),
                    str(s.customerNotes),
                    nullable(s.audioUrl),
                    nullable(s.previewUrl),
                    nullable(s.coverUrl),
                    status,
                    token,
                    nullable(s.paymentStatus),
                    nullable(s.paymentProvider),
                    nullable(s.pixTransactionId),
                    nullable(s.paidAt),
                    nullable(s.deliveredAt),
                    JSON.stringify(Array.isArray(s.adjustmentHistory) ? s.adjustmentHistory : []),
                    Boolean(s.isFavorite),
                    Boolean(s.isPurchased),
                    nullable(s.productionNotifiedAt),
                    s.createdAt ? new Date(s.createdAt) : new Date(),
                ]
            );

            console.log(`  OK     ID ${s.id} — "${s.title}" [${status}]${!s.approvalToken ? ' (token gerado)' : ''}`);
            migrated++;
        } catch (err) {
            console.error(`  ERRO   ID ${s.id} — ${err.message}`);
            errors++;
        }
    }

    // Atualiza sequence para não colidir com IDs migrados
    const maxId = await pool.query('SELECT MAX(id) as max FROM songs');
    const nextVal = (maxId.rows[0].max || 0) + 1;
    await pool.query(`SELECT setval(pg_get_serial_sequence('songs','id'), $1, false)`, [nextVal]);
    console.log(`\nSequence ajustada para próximo ID: ${nextVal}`);

    console.log(`\n=== Resultado ===`);
    console.log(`Migrados : ${migrated}`);
    console.log(`Pulados  : ${skipped} (já existiam)`);
    console.log(`Erros    : ${errors}`);

    await pool.end();
}

migrate().catch(err => {
    console.error('Falha na migração:', err.message);
    process.exit(1);
});
