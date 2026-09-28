/**
 * RANDOO ARCADE — VERCEL SERVERLESS FUNCTION HANDLER
 * Dispatches serverless requests from /api/* to the unified API handler.
 */

const { handleApiRequest, sendJson } = require('./handler');

module.exports = async (req, res) => {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    sendJson(res, 404, { ok: false, error: 'API route not found' });
  }
};
