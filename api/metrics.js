export default async function handler(req, res) {
  if (!process.env.WAKATIME_API_KEY) {
    return res.status(500).json({ error: "API Key missing in environment variables." });
  }
  const SECRETS = Buffer.from(process.env.WAKATIME_API_KEY).toString('base64');
  
  try {
    const response = await fetch('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
      headers: { 
        'Authorization': `Basic ${SECRETS}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!result.data) {
      console.error("WakaTime API Error:", result);
      return res.status(500).json({ error: "No data returned from WakaTime." });
    }

    const { data } = result;

    const dailyAvg = data.human_readable_daily_average || "0h 0m";
    const editors = data.editors?.length ? data.editors.slice(0, 2).map(e => e.name).join(', ') : "N/A";
    const os = data.operating_systems?.length ? data.operating_systems.slice(0, 2).map(o => o.name).join(', ') : "N/A";
    const categories = data.categories?.length ? data.categories.slice(0, 3).map(c => c.name).join(', ') : "N/A";


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
    console.error("Serverless Function Crash:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
