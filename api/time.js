export default function handler(req, res) {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const timeStr = chinaTime.toISOString().replace('T', ' ').substring(0, 19);
  res.status(200).json({ time: timeStr, timezone: 'Asia/Shanghai' });
}
