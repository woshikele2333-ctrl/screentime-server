const BARK_TOKEN = 'fiBsDV8NJyejdcKhDs9SAY';
const BARK_URL = `https://api.day.app/${BARK_TOKEN}`;

async function getReport(url, token) {
  const res = await fetch(`${url}/keys/log:*`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const keysData = await res.json();
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
      if (log.action === 'open') openTime = log.time;
      else if (log.action === 'close' && openTime) {
        totalMs += log.time - openTime;
        openTime = null;
      }
    }
    if (openTime) totalMs += Date.now() - openTime;
    report[app] = Math.round(totalMs / 60000);
  }
  return report;
}

async function bark(title, body) {
  await fetch(`${BARK_URL}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`);
}

export default async function handler(req, res) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  const report = await getReport(url, token);
  const alerts = [];

  const limits = { '小红书': 30, '抖音': 20, '微博': 20, 'QQ': 30, '微信': 60 };

  for (const [app, minutes] of Object.entries(report)) {
    if (limits[app] && minutes > limits[app]) {
      alerts.push(`${app}已用${minutes}分钟`);
    }
  }

  if (alerts.length > 0) {
    await bark('顾言', `乐乐，放下手机——${alerts.join('、')}`);
  }

  res.status(200).json({ report, alerts });
}
