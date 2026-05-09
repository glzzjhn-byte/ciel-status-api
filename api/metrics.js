export default async function handler(req, res) {
  if (!process.env.WAKATIME_API_KEY) {
    return res.status(500).json({ error: "API Key missing." });
  }

  const SECRETS = Buffer.from(process.env.WAKATIME_API_KEY).toString('base64');
  
  try {
    const response = await fetch('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
      headers: { 'Authorization': `Basic ${SECRETS}` }
    });

    const result = await response.json();
    if (!result.data) return res.status(500).json({ error: "No data." });

    const { data } = result;

    const getTop = (arr) => arr?.length ? arr[0] : { name: "N/A", percent: 0 };
    
    const topEditor = getTop(data.editors);
    const topOS = getTop(data.operating_systems);
    const topLang = getTop(data.languages);

    const barWidth = 180; 

    const renderBar = (y, label, name, percent, color) => `
      <text x="20" y="${y}" class="label">${label}:</text>
      <text x="110" y="${y}" class="stat">${name} (${percent}%)</text>
      <rect x="20" y="${y + 10}" width="${barWidth}" height="8" rx="4" fill="#30363d"/>
      <rect x="20" y="${y + 10}" width="${(percent / 100) * barWidth}" height="8" rx="4" fill="${color}">
        <animate attributeName="width" from="0" to="${(percent / 100) * barWidth}" dur="0.8s" fill="freeze" />
      </rect>
    `;

    const svg = `
    <svg width="420" height="200" viewBox="0 0 420 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .header { font: 700 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: #79d4ff; }
        .stat { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: #ffffff; }
        .label { font: 600 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: #b3b3b3; }
      </style>
      <rect width="420" height="200" rx="12" fill="#0d1117" stroke="#30363d" stroke-width="2"/>
      
      <text x="20" y="35" class="header">System Telemetry Log [v2.0]</text>
      <text x="300" y="35" class="label" font-size="10">AVG: ${data.human_readable_daily_average}</text>

      ${renderBar(65, "Editor", topEditor.name, topEditor.percent, "#47A1FF")}
      ${renderBar(110, "OS", topOS.name, topOS.percent, "#76E150")}
      ${renderBar(155, "Language", topLang.name, topLang.percent, "#F9D71C")}
    </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(svg);

  } catch (error) {
    return res.status(500).json({ error: "Internal Error", details: error.message });
  }
}
