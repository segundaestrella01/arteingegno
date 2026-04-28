'use strict';

/**
 * Shopify OAuth flow — supports both:
 *
 *  A) First-time install via a Shopify Partners-generated install link
 *     (Custom distribution → "Generate install link" in the dashboard).
 *     The user opens that link in a browser; Shopify redirects back to
 *     localhost:3456/callback.
 *
 *  B) Re-authentication via a self-constructed OAuth URL that the CLI
 *     opens automatically (works when the app is already installed on
 *     the store).
 *
 * Security: the callback is verified using HMAC-SHA256 signed by Shopify
 * with the Client Secret — this is equivalent to state validation and is
 * the method Shopify recommends for app installs.
 *
 * Required setup in the Partner dashboard:
 *   Allowed redirect URIs must include: http://localhost:3456/callback
 */

const http   = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REDIRECT_PORT = 3456;
const REDIRECT_URI  = `http://localhost:${REDIRECT_PORT}/callback`;
const TIMEOUT_MS    = 5 * 60 * 1000; // 5 minutes

const SCOPES = [
  'read_products',
  'write_products',
  'read_metaobjects',
  'write_metaobjects',
  'read_metaobject_definitions',
  'write_metaobject_definitions',
].join(',');

// ---------------------------------------------------------------------------
// HMAC verification
//
// Shopify signs every OAuth callback with HMAC-SHA256.
// Sort all params (excluding `hmac`), join as key=value pairs separated
// by `&`, then compute HMAC-SHA256 with the client secret.
// ---------------------------------------------------------------------------
function verifyHmac(params, clientSecret) {
  const hmac     = params.get('hmac');
  if (!hmac) return false;

  const message = Array.from(params.entries())
    .filter(([k]) => k !== 'hmac')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const digest = crypto
    .createHmac('sha256', clientSecret)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------
async function exchangeCode(shop, clientId, clientSecret, code) {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.access_token) throw new Error(`No access_token in response: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ---------------------------------------------------------------------------
// Browser helper
// ---------------------------------------------------------------------------
function openBrowser(url) {
  const p = process.platform;
  try {
    if (p === 'darwin')      execSync(`open "${url}"`);
    else if (p === 'win32')  execSync(`start "" "${url}"`);
    else                     execSync(`xdg-open "${url}"`);
  } catch {
    // Silently ignore — user will open manually
  }
}

// ---------------------------------------------------------------------------
// Main OAuth flow
// ---------------------------------------------------------------------------

/**
 * Start the local callback server, show instructions, and wait for Shopify
 * to redirect back with the authorisation code.
 *
 * Works with both:
 *   - Shopify Partners-generated install links (first-time install)
 *   - Self-constructed OAuth URLs (re-auth / already-installed stores)
 *
 * @param {string} shop           e.g. "mattiastore-3117.myshopify.com"
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {Promise<string>}     offline access token (shpat_…)
 */
function oauthFlow(shop, clientId, clientSecret) {
  return new Promise((resolve, reject) => {

    // Self-constructed fallback URL — works if the app is already installed
    // on this store, or if the store is already in your custom distribution list.
    const selfUrl = `https://${shop}/admin/oauth/authorize?` +
      new URLSearchParams({ client_id: clientId, scope: SCOPES, redirect_uri: REDIRECT_URI });

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);

      if (url.pathname !== '/callback') {
        res.writeHead(404).end('Not found');
        return;
      }

      const code  = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400).end(`OAuth error: ${error}`);
        shutdown(new Error(`OAuth denied by Shopify: ${error}`));
        return;
      }

      if (!code) {
        res.writeHead(400).end('Missing code parameter');
        shutdown(new Error('No authorisation code in callback'));
        return;
      }

      // Verify the callback is genuinely from Shopify
      if (!verifyHmac(url.searchParams, clientSecret)) {
        res.writeHead(400).end('HMAC verification failed — callback may not be from Shopify');
        shutdown(new Error('HMAC verification failed'));
        return;
      }

      try {
        const token = await exchangeCode(shop, clientId, clientSecret, code);
        res.writeHead(200, { 'Content-Type': 'text/html' }).end(`
          <html><body style="font-family:sans-serif;padding:2rem;max-width:480px">
            <h2>✅ Authenticated!</h2>
            <p>Token saved for <strong>${shop}</strong>.</p>
            <p>You can close this tab and return to your terminal.</p>
          </body></html>
        `);
        shutdown(null, token);
      } catch (err) {
        res.writeHead(500).end(err.message);
        shutdown(err);
      }
    });

    function shutdown(err, value) {
      server.close();
      clearTimeout(timer);
      if (err) reject(err);
      else resolve(value);
    }

    const timer = setTimeout(
      () => shutdown(new Error('Timeout — no callback received within 5 minutes')),
      TIMEOUT_MS
    );

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(
          `Port ${REDIRECT_PORT} is already in use. ` +
          `Close whatever is using it and try again.`
        ));
      } else {
        reject(err);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`
┌─────────────────────────────────────────────────────────┐
│  Waiting for OAuth callback on localhost:${REDIRECT_PORT}        │
└─────────────────────────────────────────────────────────┘

How to authenticate ${shop}:

  OPTION A — Shopify Partners install link (first-time install)
  ─────────────────────────────────────────────────────────
  1. Go to partners.shopify.com → App distribution → your app
  2. Find ${shop} in the custom distribution list
  3. Click "Generate install link" and open that URL in your browser
  4. Approve the app install — this tab will update automatically

  OPTION B — Direct OAuth URL (if app is already installed on this store)
  ─────────────────────────────────────────────────────────
  Open this URL in your browser:

  ${selfUrl}

Waiting…`);
    });
  });
}

module.exports = { oauthFlow, REDIRECT_URI, SCOPES };
