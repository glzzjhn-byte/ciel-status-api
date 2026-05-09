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
      MediaListCollection(userName: $name, type: ANIME, status_in: [CURRENT, COMPLETED]) {
        lists {
          entries {
            media {
              title { romaji }
              coverImage { large } 
            }
            status
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
    const cardW = 100;
    const cardH = 140;
    const startX = 25;
    const startY = 70; 
    const gapX = 90;   
    const gapY = 170; 

    const rows = Math.ceil(entries.length / columns);
    const svgHeight = rows === 1 ? 260 : 450; 

    let cardsSvg = '';
    entries.forEach((entry, index) => {
      const title = entry?.media?.title?.romaji || "Unknown Anime";
      const status = entry?.status === "COMPLETED" ? "COMPLETED" : "WATCHING";
      const img = base64Images[index];
      
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      const x = startX + col * (cardW + gapX);
      const y = startY + row * gapY;
      
      cardsSvg += `
        <g>
          <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="6" fill="#0e2744"/>
          <clipPath id="clip${index}"><rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="6"/></clipPath>
          <image href="${img}" x="${x}" y="${y}" width="${cardW}" height="${cardH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${index})"/>
          
          <rect x="${x}" y="${y + 140}" width="${cardW}" height="60" rx="0" fill="#0a1c36" opacity="0.85"/>
          <text x="${x + 50}" y="${y + 163}" font-family="Arial,sans-serif" font-weight="700" font-size="8.5" fill="#ffffff" text-anchor="middle">${title.substring(0, 18)}</text>
          
          <rect x="${x + 6}" y="${y + 175}" width="${cardW - 12}" height="12" rx="3" fill="#2ecc71"/>
          <text x="${x + 50}" y="${y + 184}" font-family="Arial,sans-serif" font-weight="700" font-size="7.5" fill="#ffffff" text-anchor="middle">${status}</text>
          
          <rect x="${x}" y="${y}" width="28" height="14" rx="3" fill="#F47521"/>
          <text x="${x + 14}" y="${y + 10}" font-family="Arial,sans-serif" font-weight="700" font-size="7.5" fill="#ffffff" text-anchor="middle">#${index + 1}</text>
        </g>
      `;
    });

    const svg = `
    <svg width="800" height="${svgHeight}" viewBox="0 0 800 ${svgHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect width="800" height="${svgHeight}" rx="10" fill="#141519"/>
      <rect width="800" height="4" rx="2" fill="#F47521"/>
      <rect width="800" height="46" y="4" fill="#141519"/>
      
      <text x="20" y="33" font-family="Arial,sans-serif" font-weight="800" font-size="15" fill="#F47521" letter-spacing="-0.3">CRUNCHYROLL</text>
      <text x="145" y="33" font-family="Arial,sans-serif" font-weight="400" font-size="12" fill="#aaaaaa">— My Watchlist Matrix</text>
      <text x="20" y="55" font-family="Arial,sans-serif" font-weight="700" font-size="11" fill="#cccccc" letter-spacing="1">🎌 TOP ANIME I WATCH</text>

      ${cardsSvg}

      <!-- Footer bar -->
      <rect y="${svgHeight - 22}" width="800" height="22" rx="0" fill="#0e0f13"/>
      <rect y="${svgHeight - 24}" width="800" height="1" fill="#2a2a35"/>
      <text x="20" y="${svgHeight - 7}" font-family="Arial,sans-serif" font-size="9" fill="#888888">🎌 Fetching via AniList GraphQL Edge Network</text>
    </svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (err) {
    return new Response(
      '<svg width="800" height="230" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="230" fill="#141519"/><text x="20" y="30" fill="#F47521" font-family="Arial">System Notice: Anime Matrix Syncing...</text></svg>', 
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}
