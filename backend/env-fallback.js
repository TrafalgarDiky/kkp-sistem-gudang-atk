// ============================================
// Fallback jika dotenv melaporkan 0 variabel (mis. .env UTF-16 / BOM / format aneh)
// ============================================

import fs from 'node:fs';

/**
 * Parse .env manual: KEY=VALUE, strip BOM, izinkan export KEY=
 * Nilai bisa dikutip "..." atau '...'
 */
export function applyFallbackEnvFromFile(envPath) {
  if (!fs.existsSync(envPath)) return { count: 0, path: envPath };

  const buf = fs.readFileSync(envPath);
  let text;
  // UTF-16 LE (BOM FF FE) — sering dari Notepad "Unicode"
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    text = buf.subarray(2).toString('utf16le');
  } else {
    text = buf.toString('utf8');
  }

  text = text.replace(/^\uFEFF/, '');
  let count = 0;

  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice(7).trim();

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    let key = line.slice(0, eq).trim().replace(/\uFEFF/g, '');
    key = key.toUpperCase();
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) continue;

    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    process.env[key] = val;
    count++;
  }

  return { count, path: envPath };
}
