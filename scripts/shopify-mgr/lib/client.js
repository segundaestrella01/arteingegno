'use strict';

const API_VERSION = '2025-01';

/**
 * Execute a GraphQL operation against the Shopify Admin API.
 *
 * @param {string} shop       e.g. "mattiastore-3117.myshopify.com"
 * @param {string} token      Admin API access token (shpat_…)
 * @param {string} query      GraphQL query or mutation string
 * @param {object} variables  Variables object (optional)
 * @returns {Promise<object>} The `data` field from the response
 * @throws on HTTP errors or GraphQL-level errors
 */
async function graphql(shop, token, query, variables = {}) {
  const url = `https://${shop}/admin/api/${API_VERSION}/graphql.json`;

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':            'application/json',
      'X-Shopify-Access-Token':  token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} from ${shop}: ${body}`);
  }

  const json = await res.json();

  if (json.errors && json.errors.length > 0) {
    const msg = json.errors.map(e => e.message).join('; ');
    throw new Error(`GraphQL error: ${msg}`);
  }

  return json.data;
}

module.exports = { graphql, API_VERSION };
