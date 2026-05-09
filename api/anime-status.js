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
    const entries = lists.flatMap(l => l.entries).filter(Boolean).slice(0, 2);

    const [img1, img2] = await Promise.all([
      toBase64(entries[0]?.media.coverImage.large),
      toBase64(entries[1]?.media.coverImage.large),
    ]);

    const title1 = entries[0]?.media.title.romaji || "Classroom of the Elite";
    const title2 = entries[1]?.media.title.romaji || "Tensei Shitara Slime";
    
    const status1 = entries[0]?.status === "COMPLETED" ? "COMPLETED" : "WATCHING";
    const status2 = entries[1]?.status === "COMPLETED" ? "COMPLETED" : "WATCHING";

    const svg = `
    <svg width="800" height="230" viewBox="0 0 800 230" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="clip1"><rect x="16" y="60" width="100" height="140" rx="6"/></clipPath>
        <clipPath id="clip2"><rect x="128" y="60" width="100" height="140" rx="6"/></clipPath>
      </defs>
      <rect width="800" height="230" rx="10" fill="#141519"/>
      <rect width="800" height="4" rx="2" fill="#F47521"/>
      <rect width="800" height="46" y="4" fill="#141519"/>
      
      <text x="20" y="33" font-family="Arial,sans-serif" font-weight="800" font-size="15" fill="#F47521" letter-spacing="-0.3">CRUNCHYROLL</text>
      <text x="145" y="33" font-family="Arial,sans-serif" font-weight="400" font-size="12" fill="#aaaaaa">— My Watchlist</text>
      <text x="20" y="55" font-family="Arial,sans-serif" font-weight="700" font-size="11" fill="#cccccc" letter-spacing="1">🎌 TOP ANIME I WATCH</text>

      <!-- CARD 1 -->
      <g>
        <rect x="16" y="60" width="100" height="140" rx="6" fill="#0e2744"/>
        <image href="${img1}" x="16" y="60" width="100" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip1)"/>
        <rect x="16" y="140" width="100" height="60" rx="0" fill="#0a1c36" opacity="0.85"/>
        <text x="66" y="163" font-family="Arial,sans-serif" font-weight="700" font-size="8.5" fill="#ffffff" text-anchor="middle">${title1.substring(0, 18)}</text>
        <rect x="22" y="175" width="47" height="12" rx="3" fill="#2ecc71"/>
        <text x="45" y="184" font-family="Arial,sans-serif" font-weight="700" font-size="7.5" fill="#ffffff" text-anchor="middle">${status1}</text>
        <rect x="16" y="60" width="28" height="14" rx="3" fill="#F47521"/>
        <text x="30" y="70" font-family="Arial,sans-serif" font-weight="700" font-size="7.5" fill="#ffffff" text-anchor="middle">#1</text>
      </g>

      <!-- CARD 2 -->
      <g>
        <rect x="128" y="60" width="100" height="140" rx="6" fill="#0a2015"/>
        <image href="${img2}" x="128" y="60" width="100" height="140" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip2)"/>
        <rect x="128" y="140" width="100" height="60" rx="0" fill="#051a0d" opacity="0.85"/>
        <text x="178" y="163" font-family="Arial,sans-serif" font-weight="700" font-size="8.5" fill="#ffffff" text-anchor="middle">${title2.substring(0, 18)}</text>
        <rect x="134" y="175" width="47" height="12" rx="3" fill="#2ecc71"/>
        <text x="157" y="184" font-family="Arial,sans-serif" font-weight="700" font-size="7.5" fill="#ffffff" text-anchor="middle">${status2}</text>
        <rect x="128" y="60" width="28" height="14" rx="3" fill="#F47521"/>
        <text x="142" y="70" font-family="Arial,sans-serif" font-weight="700" font-size="7.5" fill="#ffffff" text-anchor="middle">#2</text>
      </g>

      <!-- Footer bar -->
      <rect y="208" width="800" height="22" rx="0" fill="#0e0f13"/>
      <rect y="206" width="800" height="1" fill="#2a2a35"/>
      <text x="20" y="223" font-family="Arial,sans-serif" font-size="9" fill="#888888">🎌 Watching via AniList Sync</text>
      <rect x="700" y="211" width="82" height="15" rx="7" fill="#F47521"/>
      <text x="741" y="222" font-family="Arial,sans-serif" font-weight="800" font-size="8" fill="#ffffff" text-anchor="middle">CRUNCHYROLL</text>
    </svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (err) {
    return new Response(
      '<svg width="800" height="230" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="230" fill="#141519"/><text x="20" y="30" fill="#F47521" font-family="Arial">System Notice: Anime Status Syncing...</text></svg>', 
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}
