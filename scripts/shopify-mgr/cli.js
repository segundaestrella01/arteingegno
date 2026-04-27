#!/usr/bin/env node
'use strict';

/**
 * shopify-mgr — Shopify data model management CLI
 *
 * Uses a single Shopify Partner app (one client_id + client_secret)
 * to authenticate against any number of stores via OAuth.
 *
 * Credentials are stored in ~/.shopify-mgr/config.json (mode 600).
 *
 * Usage:
 *   node cli.js configure
 *   node cli.js auth <store.myshopify.com>
 *   node cli.js schema check <store>
 *   node cli.js schema apply <store> [file] [--dry-run]
 *   node cli.js stores
 */

const readline = require('readline');

const config = require('./lib/config');
const { oauthFlow, REDIRECT_URI, SCOPES } = require('./lib/auth');
const ENV_FILE = config.envFilePath();
const schema = require('./lib/schema');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve =>
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); })
  );
}

function printHelp() {
  console.log(`
shopify-mgr — Shopify data model management CLI

SETUP (one-time):
  node cli.js configure
      Save your Partner app Client ID and Secret to .env at the project root

PER-STORE AUTH:
  node cli.js auth <store.myshopify.com>
      Run the OAuth flow. Opens a browser, waits for approval, saves the token.

SCHEMA:
  node cli.js schema check <store>
      List all existing metaobject and product metafield definitions.

  node cli.js schema apply <store> [--dry-run]
      Apply all .graphql definitions in order. Skips already-existing ones.

  node cli.js schema apply <store> <path/to/file.graphql> [--dry-run]
      Apply a single definition file.
      Path is relative to scripts/shopify-data-model/ (e.g. metaobjects/theme.graphql)

STORES:
  node cli.js stores
      List all stores that have a saved access token.

OPTIONS:
  --dry-run    (schema apply only) Print what would be executed without running it.

EXAMPLES:
  node cli.js configure
  node cli.js auth mattiastore-3117.myshopify.com
  node cli.js schema check mattiastore-3117.myshopify.com
  node cli.js schema apply mattiastore-3117.myshopify.com --dry-run
  node cli.js schema apply mattiastore-3117.myshopify.com
  node cli.js schema apply mattiastore-3117.myshopify.com metaobjects/collection.graphql
`);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdConfigure() {
  console.log('\n📋 Configure your Shopify Partner app credentials');
  console.log('   Get these from: https://partners.shopify.com → Apps → [Your App] → Client credentials');
  console.log(`   The app must have this redirect URI allowed:\n     ${REDIRECT_URI}`);
  console.log(`   Required scopes: ${SCOPES}\n`);

  const clientId     = await prompt('Client ID:     ');
  const clientSecret = await prompt('Client Secret: ');

  if (!clientId || !clientSecret) {
    console.error('❌ Both Client ID and Client Secret are required.');
    process.exit(1);
  }

  config.setClientCredentials(clientId, clientSecret);
  console.log(`\n✅ Credentials saved to ${ENV_FILE}`);
}

async function cmdAuth(store) {
  if (!store) {
    console.error('❌ Usage: node cli.js auth <store.myshopify.com>');
    process.exit(1);
  }

  const { clientId, clientSecret } = config.getClient();
  console.log(`\nStarting OAuth flow for ${store}…`);

  const token = await oauthFlow(store, clientId, clientSecret);
  config.setToken(store, token);

  const key = `SHOPIFY_TOKEN_${store.split('.')[0].replace(/[^a-z0-9]/gi, '_').toUpperCase()}`;
  console.log(`✅ Token saved to ${ENV_FILE}`);
  console.log(`   Key: ${key}`);
  console.log(`   You can now run: node cli.js schema check ${store}`);
}

async function cmdSchema(subArgs) {
  const sub    = subArgs[0];
  const store  = subArgs[1];
  const dryRun = subArgs.includes('--dry-run');

  if (!sub || !store) {
    console.error('❌ Usage: node cli.js schema <check|apply> <store> [file] [--dry-run]');
    process.exit(1);
  }

  const token = config.getToken(store);

  if (sub === 'check') {
    await schema.check(store, token);
    return;
  }

  if (sub === 'apply') {
    // Third positional arg (if present and not a flag) is the file path
    const fileArg = subArgs[2] && !subArgs[2].startsWith('--') ? subArgs[2] : null;

    if (fileArg) {
      console.log(`\nApplying ${fileArg} to ${store}${dryRun ? ' (dry-run)' : ''}…`);
      const result = await schema.applyFile(store, token, fileArg, dryRun);
      if (result?._skipped) console.log('↩️  Already exists — skipped.');
      else if (!dryRun)      console.log('✅ Done.');
    } else {
      await schema.applyAll(store, token, dryRun);
    }
    return;
  }

  console.error(`❌ Unknown schema sub-command: "${sub}". Use "check" or "apply".`);
  process.exit(1);
}

function cmdStores() {
  const stores = config.listStores();
  if (stores.length === 0) {
    console.log('No stores authenticated yet. Run: node cli.js auth <store.myshopify.com>');
    return;
  }
  console.log('\nAuthenticated stores:');
  stores.forEach(({ store, savedAt }) =>
    console.log(`  • ${store.padEnd(50)} (token saved ${savedAt ?? 'unknown'})`)
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const [,, command, ...rest] = process.argv;

  switch (command) {
    case 'configure': await cmdConfigure();          break;
    case 'auth':      await cmdAuth(rest[0]);         break;
    case 'schema':    await cmdSchema(rest);          break;
    case 'stores':    cmdStores();                    break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:   printHelp();                   break;
    default:
      console.error(`❌ Unknown command: "${command}". Run "node cli.js help" for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
