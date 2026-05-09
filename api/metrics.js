export default async function handler(req, res) {
  if (!process.env.WAKATIME_API_KEY) {
    return res.status(500).json({ error: "API Key missing." });
  }

  const SECRETS = Buffer.from(process.env.WAKATIME_API_KEY).toString('base64');
  
  try {
    const response = await fetch('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
      headers: { 'Authorization': `Basic ${SECRETS}` }
    });

    const { data } = await response.json();
    if (!data) return res.status(500).json({ error: "No data." });

    const barWidth = 160;
    const itemHeight = 35; 
    const sectionPadding = 50; 

    const renderSection = (items, title, startY, color) => {
      if (!items || items.length === 0) return { html: "", nextY: startY };
      
      let html = `<text x="20" y="${startY}" class="header">${title}</text>`;
      items.forEach((item, index) => {
        const y = startY + 25 + (index * itemHeight);
        const calcWidth = (item.percent / 100) * barWidth;
        
        html += `
          <text x="20" y="${y}" class="label">${item.name}</text>
          <text x="200" y="${y}" class="stat">${item.percent}%</text>
          <rect x="20" y="${y + 8}" width="${barWidth}" height="6" rx="3" fill="#30363d"/>
          <rect x="20" y="${y + 8}" width="${calcWidth}" height="6" rx="3" fill="${color}">
            <animate attributeName="width" from="0" to="${calcWidth}" dur="0.8s" fill="freeze" />
          </rect>
        `;
      });
      
      return { 
        html, 
        nextY: startY + 40 + (items.length * itemHeight) 
      };
    };

    // Process all categories
    const catData = renderSection(data.categories, "■ CATEGORIES", 60, "#FF79C6");
    const langData = renderSection(data.languages, "■ LANGUAGES", catData.nextY, "#F1FA8C");
    const editData = renderSection(data.editors, "■ EDITORS", langData.nextY, "#8BE9FD");
    const osData = renderSection(data.operating_systems, "■ OPERATING SYSTEMS", editData.nextY, "#BD93F9");

    const totalHeight = osData.nextY + 20;

    const svg = `
    <svg width="350" height="${totalHeight}" viewBox="0 0 350 ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .header { font: 700 14px 'Courier New', monospace; fill: #ffb86c; }
        .stat { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #f8f8f2; }
        .label { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #6272a4; }
      </style>
      <rect width="350" height="${totalHeight}" rx="10" fill="#282a36" stroke="#44475a" stroke-width="2"/>
      
      <text x="20" y="30" class="header" fill="#50fa7b">📜Waka Time Stats</text>
      <text x="220" y="30" class="label" font-size="10">AVG: ${data.human_readable_daily_average}</text>

      ${catData.html}
      ${langData.html}
      ${editData.html}
      ${osData.html}
    </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(svg);

  } catch (error) {
    return res.status(500).json({ error: "Internal Error", details: error.message });
  }
}
