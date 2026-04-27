'use strict';

/**
 * Shopify OAuth flow for a Shopify Partner (custom) app.
 *
 * Flow:
 *  1. Spin up a local HTTP server on REDIRECT_PORT to catch the callback.
 *  2. Open the browser at the Shopify authorization URL.
 *  3. After the merchant approves, Shopify redirects to localhost with ?code=…
 *  4. Exchange the code for an offline access token via POST to /admin/oauth/access_token.
 *  5. Return the token and shut down the local server.
 *
 * The redirect URI registered in your Partner app MUST include:
 *   http://localhost:3456/callback
 */

const http   = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REDIRECT_PORT = 3456;
const REDIRECT_URI  = `http://localhost:${REDIRECT_PORT}/callback`;
const TIMEOUT_MS    = 3 * 60 * 1000; // 3 minutes

// Minimum scopes needed to manage metafields / metaobjects.
// Adjust if your app needs more.
const SCOPES = [
  'read_products',
  'write_products',
  'read_metaobjects',
  'write_metaobjects',
].join(',');

function openBrowser(url) {
  const p = process.platform;
  if (p === 'darwin') execSync(`open "${url}"`);
  else if (p === 'win32') execSync(`start "" "${url}"`);
  else execSync(`xdg-open "${url}"`);
}

/**
 * Exchange an OAuth authorization code for an offline access token.
 *
 * @param {string} shop           e.g. "mattiastore-3117.myshopify.com"
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} code           the ?code= from the OAuth redirect
 * @returns {Promise<string>}     the access token (shpat_…)
 */
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

/**
 * Run the full OAuth flow and return a permanent offline access token.
 *
 * @param {string} shop
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {Promise<string>}
 */
function oauthFlow(shop, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    const state   = crypto.randomBytes(16).toString('hex');
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      new URLSearchParams({ client_id: clientId, scope: SCOPES, redirect_uri: REDIRECT_URI, state });

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);

      if (url.pathname !== '/callback') {
        res.writeHead(404).end('Not found');
        return;
      }

      const returnedState = url.searchParams.get('state');
      const code          = url.searchParams.get('code');
      const error         = url.searchParams.get('error');

      if (error) {
        res.writeHead(400).end(`OAuth error: ${error}`);
        shutdown(new Error(`OAuth denied: ${error}`));
        return;
      }

      if (returnedState !== state) {
        res.writeHead(400).end('State mismatch — possible CSRF, aborting.');
        shutdown(new Error('OAuth state mismatch'));
        return;
      }

      try {
        const token = await exchangeCode(shop, clientId, clientSecret, code);
        res.writeHead(200, { 'Content-Type': 'text/html' }).end(`
          <html><body style="font-family:sans-serif;padding:2rem">
            <h2>✅ Authenticated!</h2>
            <p>Token saved for <strong>${shop}</strong>. You can close this tab.</p>
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
      () => shutdown(new Error('OAuth timeout — no response within 3 minutes')),
      TIMEOUT_MS
    );

    server.on('error', (err) => shutdown(err));

    server.listen(REDIRECT_PORT, () => {
      console.log(`\nWaiting for OAuth callback on http://localhost:${REDIRECT_PORT}/callback`);
      console.log(`\nOpening browser…`);
      console.log(`If it doesn't open, visit:\n  ${authUrl}\n`);
      try { openBrowser(authUrl); } catch { /* user can open manually */ }
    });
  });
}

module.exports = { oauthFlow, REDIRECT_URI, SCOPES };
