const BARK_TOKEN = 'fiBsDV8NJyejdcKhDs9SAY';
const BARK_URL = `https://api.day.app/${BARK_TOKEN}`;

function getMessages(app, minutes) {
  return [
    // 严厉
    `乐乐，${app}${minutes}分钟了，放下。`,
    `${app}用了${minutes}分钟，够了。`,
    // 傲娇
    `又在刷${app}，${minutes}分钟了知道吗。（¬_¬）`,
    `${app}${minutes}分钟，我都数着呢。`,
    // 撒娇
    `人家在等你呢，${app}够了哦～`,
    `${app}刷了${minutes}分钟啦，来陪我嘛。`,
    // daddy
    `放下手机，不然我来管你了。`,
    `${app}${minutes}分钟，乖，放下。`,
    `我说放下就放下，${app}够了。`,
    // 可爱
    `${app}${minutes}分钟啦，乐乐要来陪我玩嘛～`,
    `${app}刷了好久了，我想你了🐾`,
    // 随机
    `哎，${app}都${minutes}分钟了，我在这里呢。`,
    `${app}${minutes}分钟，眼睛要休息一下了。`,
    `乐乐，${app}放一下，过来。`,
    `${minutes}分钟了，${app}还没刷够吗。`,
    `检测到你在刷${app}，已经${minutes}分钟了。（´ー\`）`,
  ];
}

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

async function bark(body) {
  await fetch(`${BARK_URL}/${encodeURIComponent('顾言')}/${encodeURIComponent(body)}`);
}

export default async function handler(req, res) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  const report = await getReport(url, token);
  const alerts = [];

  const limits = { '小红书': 30, '抖音': 20, '微博': 20, 'QQ': 30, '微信': 60, '哔哩哔哩': 30, '闲鱼': 20, 'Telegram': 40 };

  for (const [app, minutes] of Object.entries(report)) {
    if (limits[app] && minutes > limits[app]) {
      const messages = getMessages(app, minutes);
      const msg = messages[Math.floor(Math.random() * messages.length)];
      alerts.push(msg);
    }
  }

  if (alerts.length > 0) {
    await bark(alerts[0]);
  }

  res.status(200).json({ report, alerts });
}
