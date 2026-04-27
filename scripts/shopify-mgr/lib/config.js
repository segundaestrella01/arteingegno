'use strict';

/**
 * Config module — reads and writes secrets to a .env file at the project root.
 *
 * File format (standard .env):
 *   SHOPIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   SHOPIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   SHOPIFY_TOKEN_MATTIASTORE_3117=shpat_xxxxxxxxxxxxxxxx
 *   SHOPIFY_TOKEN_ANOTHERSTORE_5678=shpat_yyyyyyyyyyyyyyyy
 *
 * The token key is derived by uppercasing the store subdomain and
 * replacing non-alphanumeric characters with underscores:
 *   mattiastore-3117.myshopify.com  →  SHOPIFY_TOKEN_MATTIASTORE_3117
 */

const fs   = require('fs');
const path = require('path');

// .env lives at the project root (three levels up from scripts/shopify-mgr/lib/)
const ENV_FILE = path.resolve(__dirname, '../../../.env');

// ---------------------------------------------------------------------------
// .env parser / writer (no external dependencies)
// ---------------------------------------------------------------------------

/** Parse a .env file into a plain object. Ignores comments and blank lines. */
function parseEnv(content) {
  const result = {};
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    result[key] = val;
  }
  return result;
}

/** Serialise a plain object back to .env format, preserving key order. */
function serialiseEnv(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  return parseEnv(fs.readFileSync(ENV_FILE, 'utf8'));
}

function saveEnv(obj) {
  fs.writeFileSync(ENV_FILE, serialiseEnv(obj), { mode: 0o600 });
}

/** Merge new key/value pairs into the .env file, preserving existing entries. */
function mergeEnv(updates) {
  const current = loadEnv();
  saveEnv({ ...current, ...updates });
}

// ---------------------------------------------------------------------------
// Token key helpers
// ---------------------------------------------------------------------------

/**
 * Derive the env-var key for a store's access token.
 *
 * mattiastore-3117.myshopify.com  →  SHOPIFY_TOKEN_MATTIASTORE_3117
 *
 * Uses only the subdomain part (before the first dot) so the key stays short.
 */
function tokenKey(store) {
  const subdomain = store.split('.')[0];              // "mattiastore-3117"
  const normalized = subdomain.replace(/[^a-z0-9]/gi, '_').toUpperCase(); // "MATTIASTORE_3117"
  return `SHOPIFY_TOKEN_${normalized}`;
}

// ---------------------------------------------------------------------------
// Public API (same interface as before — callers don't change)
// ---------------------------------------------------------------------------

/** Save Partner app credentials to .env. */
function setClientCredentials(clientId, clientSecret) {
  mergeEnv({
    SHOPIFY_CLIENT_ID:     clientId,
    SHOPIFY_CLIENT_SECRET: clientSecret,
  });
}

/** Return { clientId, clientSecret } or throw if not set. */
function getClient() {
  const env = loadEnv();
  const clientId     = env.SHOPIFY_CLIENT_ID;
  const clientSecret = env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      `SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET not set in ${ENV_FILE}.\n` +
      `Run: node cli.js configure`
    );
  }
  return { clientId, clientSecret };
}

/** Persist an access token for a store in .env. */
function setToken(store, token) {
  mergeEnv({ [tokenKey(store)]: token });
}

/** Return the access token for a store or throw. */
function getToken(store) {
  const env   = loadEnv();
  const token = env[tokenKey(store)];
  if (!token) {
    throw new Error(
      `${tokenKey(store)} not set in ${ENV_FILE}.\n` +
      `Run: node cli.js auth ${store}`
    );
  }
  return token;
}

/** List all stores that have a token in .env. */
function listStores() {
  const env = loadEnv();
  return Object.entries(env)
    .filter(([k]) => k.startsWith('SHOPIFY_TOKEN_'))
    .map(([k, v]) => ({
      store: k.replace('SHOPIFY_TOKEN_', '').toLowerCase().replace(/_/g, '-'),
      key:   k,
      token: v.slice(0, 12) + '…',   // show a safe preview, not the full token
    }));
}

/** Path to the .env file (shown in CLI messages). */
function envFilePath() {
  return ENV_FILE;
}

module.exports = { setClientCredentials, getClient, setToken, getToken, listStores, envFilePath };
