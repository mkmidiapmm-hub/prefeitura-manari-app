/* Contagem pública agregada. Não coleta IP, nome, e-mail ou conta do visitante. */
const COOKIE = 'manari_portal_visit';
const SESSION_SECONDS = 30 * 60;
const HOSTS = new Set(['manari.pe.gov.br', 'www.manari.pe.gov.br']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BOT = /bot\b|crawler|spider|headless|lighthouse|preview|monitor/i;
const TOTAL_SQL = 'SELECT total, started_at FROM visit_totals WHERE id = 1';
function response(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff', ...headers
  }});
}
function readCookie(request) {
  const raw = (request.headers.get('Cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='));
  const id = raw?.slice(COOKIE.length + 1);
  return id && UUID.test(id) ? id : null;
}
function payload(row) {
  if (!row || !Number.isSafeInteger(row.total) || row.total < 0) throw new Error('Invalid visit total');
  return {total: row.total, startedAt: row.started_at};
}
export async function onRequest({request, env}) {
  const url = new URL(request.url);
  if (!['GET', 'POST'].includes(request.method)) return response({error: 'Method not allowed'}, 405, {Allow: 'GET, POST'});
  if (!HOSTS.has(url.hostname)) return response({error: 'Counter available on the official portal'}, 403);
  if (request.method === 'POST' && (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site' || !request.headers.get('Content-Type')?.startsWith('application/json'))) return response({error: 'Invalid origin or content type'}, 403);
  if (!env.VISITS_DB) return response({error: 'Counter temporarily unavailable'}, 503);
  try {
    if (request.method === 'GET' || BOT.test(request.headers.get('User-Agent') || '')) {
      return response(payload(await env.VISITS_DB.prepare(TOTAL_SQL).first()));
    }
    const id = readCookie(request) || crypto.randomUUID();
    const results = await env.VISITS_DB.batch([
      env.VISITS_DB.prepare('INSERT OR IGNORE INTO visit_sessions (id) VALUES (?)').bind(id),
      env.VISITS_DB.prepare(TOTAL_SQL),
      env.VISITS_DB.prepare('DELETE FROM visit_sessions WHERE id IN (SELECT id FROM visit_sessions WHERE created_at < unixepoch() - 86400 ORDER BY created_at LIMIT 100)')
    ]);
    return response(payload(results[1].results[0]), 200, {
      'Set-Cookie': `${COOKIE}=${id}; Domain=manari.pe.gov.br; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`
    });
  } catch {
    return response({error: 'Counter temporarily unavailable'}, 503);
  }
}
