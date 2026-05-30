export default async function handler(req, res) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  const keysRes = await fetch(`${url}/keys/log:*`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const keysData = await keysRes.json();
  const keys = keysData.result || [];

  const report = {};

  for (const key of keys) {
    const app = key.replace('log:', '');
    const logsRes = await fetch(`${url}/lrange/${key}/0/-1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const logsData = await logsRes.json();
    const logs = (logsData.result || []).map(l => JSON.parse(l));

    let totalMs = 0;
    let openTime = null;

    for (const log of logs) {
      if (log.action === 'open') {
        openTime = log.time;
      } else if (log.action === 'close' && openTime) {
        totalMs += log.time - openTime;
        openTime = null;
      }
    }

    if (openTime) totalMs += Date.now() - openTime;

    report[app] = {
      totalMinutes: Math.round(totalMs / 60000),
      sessions: logs.filter(l => l.action === 'open').length
    };
  }

  res.status(200).json(report);
}
