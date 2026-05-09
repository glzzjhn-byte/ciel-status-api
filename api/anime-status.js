export const config = {
  runtime: 'edge', 
};

async function toBase64(url) {
  if (!url) return '';
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const mime = res.headers.get('content-type') || 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch (e) {
    return '';
  }
}

export default async function handler(req) {
  const username = "JayJohn21";
  const query = `
    query ($name: String) {
      MediaListCollection(userName: $name, type: ANIME, status_in: [CURRENT, COMPLETED, PAUSED, PLANNING, DROPPED]) {
        lists {
          entries {
            media {
              title { romaji }
              coverImage { large } 
              episodes
            }
            status
            progress
            score
            notes
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { name: username } })
    });
    
    const json = await response.json();
    const lists = json.data?.MediaListCollection?.lists || [];
    const entries = lists.flatMap(l => l.entries).filter(Boolean).slice(0, 8);

    const imagePromises = entries.map(entry => toBase64(entry?.media?.coverImage?.large));
    const base64Images = await Promise.all(imagePromises);

    const columns = 4; 
    const cardW = 140; 
    const cardH = 280; 
    const startX = 40; 
    const startY = 70; 
    const gapX = 55;   
    const gapY = 320;  
    
    const rows = Math.ceil(entries.length / columns);
    const svgHeight = rows === 1 ? 440 : 760; 

    let cardsSvg = '';
    entries.forEach((entry, index) => {
      const title = entry?.media?.title?.romaji || "Unknown Anime";
      const rawStatus = entry?.status || "CURRENT";
      let statusColor = "#3498db"; 
      let displayStatus = "WATCHING";
      
      if (rawStatus === "COMPLETED") { statusColor = "#2ecc71"; displayStatus = "COMPLETED"; }
      else if (rawStatus === "CURRENT") { statusColor = "#3498db"; displayStatus = "WATCHING"; }
      else if (rawStatus === "PAUSED") { statusColor = "#f39c12"; displayStatus = "PAUSED"; }
      else if (rawStatus === "PLANNING") { statusColor = "#8e44ad"; displayStatus = "PLANNING"; }
      else if (rawStatus === "DROPPED") { statusColor = "#e74c3c"; displayStatus = "DROPPED"; }

      const score = entry?.score > 0 ? entry.score : "N/A";
      const progress = entry?.progress || 0;
      const totalEp = entry?.media?.episodes || "?";
      
      const rawNote = entry?.notes || "No system notes.";
      const noteStr = rawNote.length > 24 ? rawNote.substring(0, 22) + "..." : rawNote;
      
      const img = base64Images[index];
      
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * gapY;
      
      cardsSvg += `
        <g>
          <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="6" fill="#0e2744"/>
          
          <clipPath id="clip${index}"><rect x="${x}" y="${y}" width="${cardW}" height="180" rx="6"/></clipPath>
          <image href="${img}" x="${x}" y="${y}" width="${cardW}" height="180" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${index})"/>
          
          <rect x="${x}" y="${y}" width="28" height="18" rx="3" fill="#F47521"/>
          <text x="${x + 14}" y="${y + 12}" font-family="Arial,sans-serif" font-weight="800" font-size="9" fill="#ffffff" text-anchor="middle">#${index + 1}</text>

          <rect x="${x + cardW - 40}" y="${y}" width="40" height="18" rx="3" fill="#f1c40f"/>
          <text x="${x + cardW - 20}" y="${y + 12}" font-family="Arial,sans-serif" font-weight="800" font-size="9" fill="#000000" text-anchor="middle">⭐ ${score}</text>

          <rect x="${x}" y="${y + 160}" width="${cardW}" height="20" fill="#000000" opacity="0.85"/>
          <text x="${x + cardW / 2}" y="${y + 174}" font-family="Arial,sans-serif" font-weight="700" font-size="9" fill="#2ecc71" text-anchor="middle">📺 Ep: ${progress} / ${totalEp}</text>

          <rect x="${x}" y="${y + 180}" width="${cardW}" height="100" rx="0" fill="#0a1c36" opacity="0.9"/>
          
          <text x="${x + cardW / 2}" y="${y + 205}" font-family="Arial,sans-serif" font-weight="700" font-size="10" fill="#ffffff" text-anchor="middle">${title.substring(0, 20)}</text>
          
          <!-- Colored Status Badge -->
          <rect x="${x + 25}" y="${y + 220}" width="${cardW - 50}" height="16" rx="4" fill="${statusColor}"/>
          <text x="${x + cardW / 2}" y="${y + 231}" font-family="Arial,sans-serif" font-weight="700" font-size="8" fill="#ffffff" text-anchor="middle">${displayStatus}</text>
          
          <rect x="${x + 10}" y="${y + 248}" width="${cardW - 20}" height="1" fill="#1d3d63"/>

          <text x="${x + 10}" y="${y + 265}" font-family="Arial,sans-serif" font-style="italic" font-weight="400" font-size="9" fill="#aaaaaa">📝 ${noteStr}</text>
        </g>
      `;
    });

    const svg = `
    <svg width="800" height="${svgHeight}" viewBox="0 0 800 ${svgHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect width="800" height="${svgHeight}" rx="10" fill="#141519"/>
      <rect width="800" height="4" rx="2" fill="#F47521"/>
      <rect width="800" height="46" y="4" fill="#141519"/>
      
      <text x="20" y="33" font-family="Arial,sans-serif" font-weight="800" font-size="15" fill="#F47521" letter-spacing="-0.3">CRUNCHYROLL</text>
      <text x="145" y="33" font-family="Arial,sans-serif" font-weight="400" font-size="12" fill="#aaaaaa">— Jay-John WatchList🙂</text>
      <text x="20" y="55" font-family="Arial,sans-serif" font-weight="700" font-size="11" fill="#cccccc" letter-spacing="1">🎌 TOP 8 My AnimeList</text>

      ${cardsSvg}

      <rect y="${svgHeight - 22}" width="800" height="22" rx="0" fill="#0e0f13"/>
      <rect y="${svgHeight - 24}" width="800" height="1" fill="#2a2a35"/>
      <text x="20" y="${svgHeight - 7}" font-family="Arial,sans-serif" font-size="9" fill="#888888">🎌 Syncing:every 5 min | Real-time Status Data</text>
    </svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    return new Response(
      '<svg width="800" height="230" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="230" fill="#141519"/><text x="20" y="30" fill="#F47521" font-family="Arial">System Notice: Status UI Booting...</text></svg>', 
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}
