// Simple health-check — no TypeScript, no dependencies
// If this shows up in Vercel Functions tab, API detection is working.
// Visit: GET /api/health
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
}
