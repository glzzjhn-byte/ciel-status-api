export const config = {
  runtime: 'edge', // Using Edge for faster response times
};

async function toBase64(url) {
  if (!url) return '';
  try {
    const res = await fetch(url);
    const blob = await res.arrayBuffer();
    // In Edge Runtime, we use btoa instead of Buffer
    const base64 = btoa(
      new Uint8Array(blob).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
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
              coverImage { large } # 'large' is smaller than 'extraLarge', faster to load
            }
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
    const entries = json.data.MediaListCollection.lists.flatMap(l => l.entries).slice(0, 2);

    const [img1, img2] = await Promise.all([
      toBase64(entries[0]?.media.coverImage.large),
      toBase64(entries[1]?.media.coverImage.large),
    ]);

    const title1 = entries[0]?.media.title.romaji || "N/A";
    const title2 = entries[1]?.media.title.romaji || "N/A";

    const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" rx="10" fill="#141519"/>
      <image href="${img1}" x="10" y="10" width="80" height="110" preserveAspectRatio="xMidYMid slice" />
      <text x="10" y="135" font-family="Arial" font-size="10" fill="#fff">${title1.substring(0, 15)}</text>
      <image href="${img2}" x="110" y="10" width="80" height="110" preserveAspectRatio="xMidYMid slice" />
      <text x="110" y="135" font-family="Arial" font-size="10" fill="#fff">${title2.substring(0, 15)}</text>
    </svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (err) {
    return new Response('<svg xmlns="http://www.w3.org/2000/svg"><text y="20" fill="red">Error</text></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}
