const { data } = require('./screentime');

export default function handler(req, res) {
  const report = {};
  
  for (const app in data) {
    const logs = data[app].logs;
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
    
    if (data[app].status === 'open' && openTime) {
      totalMs += Date.now() - openTime;
    }
    
    const minutes = Math.round(totalMs / 60000);
    report[app] = {
      status: data[app].status,
      totalMinutes: minutes,
      sessions: logs.length
    };
  }
  
  res.status(200).json(report);
}
