export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() ?? 0,
  })
}
