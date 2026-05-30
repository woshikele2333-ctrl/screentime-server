export const config = { runtime: 'edge', maxDuration: 5 };
export default async function handler(req, res) {
  const app = req.query.app;
  if (!app) return res.status(400).json({ error: 'missing app' });

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  const now = Date.now();
  const key = `app:${app}`;

  const getRes = await fetch(`${url}/get/${key}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const getData = await getRes.json();
  const current = getData.result || 'close';
  const next = current === 'close' ? 'open' : 'close';

  await fetch(`${url}/set/${key}/${next}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const logKey = `log:${app}`;
  const logEntry = JSON.stringify({ action: next, time: now });
  await fetch(`${url}/rpush/${logKey}/${encodeURIComponent(logEntry)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  await fetch(`${url}/expire/${logKey}/86400`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  res.status(200).json({ app, action: next, time: new Date(now).toLocaleString('zh-CN') });
}
