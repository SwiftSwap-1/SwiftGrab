/* ============================================================
   SwiftGrab — Cobalt API Proxy (Netlify Function)
   Bypasses CORS so browser can fetch download URLs
   ============================================================ */

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const COBALT_INSTANCES = [
    'https://api.cobalt.tools/',
    'https://cobalt.api.timelessnesses.me/',
    'https://cobalt.drgns.space/',
  ];

  let lastError = '';

  for (const instance of COBALT_INSTANCES) {
    try {
      const res = await fetch(instance, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: event.body,
      });

      const text = await res.text();

      if (res.ok) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: text,
        };
      }

      lastError = `${instance} returned ${res.status}`;
    } catch (err) {
      lastError = `${instance} failed: ${err.message}`;
      console.warn('[cobalt-proxy]', lastError);
    }
  }

  return {
    statusCode: 502,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ status: 'error', message: 'All Cobalt instances failed', detail: lastError }),
  };
};
