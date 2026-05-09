const fetch = require('node-fetch');

export default async function handler(req, res) {
  // 1. Fetch data from WakaTime API
  // You MUST set WAKATIME_API_KEY in your Vercel Environment Variables
  const SECRETS = Buffer.from(process.env.WAKATIME_API_KEY).toString('base64');
  
  try {
    const response = await fetch('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
      headers: { Authorization: `Basic ${SECRETS}` }
    });
    const { data } = await response.json();

    // 2. Extract the metrics you requested
    const dailyAvg = data.human_readable_daily_average || "0h 0m";
    const editors = data.editors.slice(0, 2).map(e => e.name).join(', ');
    const os = data.operating_systems.slice(0, 2).map(o => o.name).join(', ');
    const categories = data.categories.slice(0, 3).map(c => c.name).join(', ');

    // 3. Generate the SVG (System Theme)
    const svg = `
    <svg width="400" height="150" viewBox="0 0 400 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .header { font: 700 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: #79d4ff; }
        .stat { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #ffffff; }
        .label { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #b3b3b3; }
      </style>
      <rect width="400" height="150" rx="10" fill="#0d1117" stroke="#30363d" stroke-width="2"/>
      <text x="20" y="30" class="header">System Telemetry Log [Last 7 Days]</text>
      
      <text x="20" y="60" class="label">Daily Avg:</text>
      <text x="120" y="60" class="stat">${dailyAvg}</text>
      
      <text x="20" y="85" class="label">Editors:</text>
      <text x="120" y="85" class="stat">${editors}</text>
      
      <text x="20" y="110" class="label">OS / Env:</text>
      <text x="120" y="110" class="stat">${os}</text>
      
      <text x="20" y="135" class="label">Categories:</text>
      <text x="120" y="135" class="stat">${categories}</text>
    </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(svg);

  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch telemetry data" });
  }
}
