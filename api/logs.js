const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.HEALTHTRACK_DATA_FILE || path.join('/tmp', 'healthtrack-health-data.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { logs: [] };
  }

  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { logs: [] };
  }
}

function saveData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const requestUrl = new URL(req.url, 'https://healthtrack.vercel.app');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (requestUrl.pathname !== '/api/logs') {
    res.status(404).json({ status: 'error', message: 'Not found' });
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json(loadData());
    return;
  }

  if (req.method === 'POST') {
    try {
      const entry = await parseBody(req);
      entry.savedAt = new Date().toISOString();

      const data = loadData();
      data.logs = (data.logs || []).filter(item => item.date !== entry.date);
      data.logs.push(entry);
      data.logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      saveData(data);

      res.status(200).json({ status: 'ok', savedAt: entry.savedAt });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
    return;
  }

  res.status(405).json({ status: 'error', message: 'Method not allowed' });
};
