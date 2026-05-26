/* SwiftGrab — Cobalt API Proxy */
exports.handler = async (event) => {
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

  const INSTANCES = [
    'https://api.cobalt.tools/',
    'https://cobalt.api.timelessnesses.me/',
    'https://cobalt.drgns.space/',
  ];

  for (const url of INSTANCES) {
    try {
      const res = await fetch(url, {
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
    } catch (err) {
      console.warn('[cobalt]', url, err.message);
    }
  }

  return {
    statusCode: 502,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ status: 'error', message: 'All Cobalt instances failed' }),
  };
};
