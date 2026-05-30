const data = {};

export default function handler(req, res) {
  const app = req.query.app;
  if (!app) return res.status(400).json({ error: 'missing app' });

  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;

  if (!data[app]) data[app] = { status: 'close', logs: [] };

  const current = data[app].status;
  const next = current === 'close' ? 'open' : 'close';
  data[app].status = next;
  data[app].logs.push({ action: next, time: now });

  data[app].logs = data[app].logs.filter(l => l.time > cutoff);

  res.status(200).json({ app, action: next, time: new Date(now).toLocaleString('zh-CN') });
}
