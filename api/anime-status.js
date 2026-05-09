async function toBase64DataURI(url) {
  if (!url) return '';
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const b64 = Buffer.from(arrayBuffer).toString('base64');
    const mime = res.headers.get('content-type') || 'image/jpeg';
    return `data:${mime};base64,${b64}`;
  } catch (e) {
    console.error("Image fetch failed", e);
    return ''; 
  }
}


export default async function handler(req, res) {
  const username = "JayJohn21";
  const query = `
    query ($name: String) {
      MediaListCollection(userName: $name, type: ANIME, status_in: [CURRENT, COMPLETED]) {
        lists {
          entries {
            media {
              title { romaji }
              coverImage { extraLarge }
              averageScore
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
    const entries = json.data.MediaListCollection.lists[0].entries.slice(0, 2);

    const allEntries = json.data.MediaListCollection.lists.flatMap(list => list.entries);
    const entries = allEntries.slice(0, 2);


    const [img1, img2] = await Promise.all([
      toBase64DataURI(anime1.coverImage.extraLarge),
      toBase64DataURI(anime2.coverImage.extraLarge),
    ]);

    const svg = `
    <svg width="800" height="230" viewBox="0 0 800 230" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="clip1"><rect x="0" y="0" width="100" height="140" rx="6"/></clipPath>
        <clipPath id="clip2"><rect x="0" y="0" width="100" height="140" rx="6"/></clipPath>
      </defs>
      <rect width="800" height="230" rx="10" fill="#141519"/>
      <rect width="800" height="4" rx="2" fill="#F47521"/>
      <text x="20" y="33" font-family="Arial" font-weight="800" font-size="15" fill="#F47521">CRUNCHYROLL</text>
      <text x="145" y="33" font-family="Arial" font-size="12" fill="#aaaaaa">— Real-time Status</text>

      <!-- Card 1 -->
      <g transform="translate(16, 60)">
        <image href="${img1}" width="100" height="140" clip-path="url(#clip1)" preserveAspectRatio="xMidYMid slice"/>
        <rect y="80" width="100" height="60" fill="#0a1c36" fill-opacity="0.9"/>
        <text x="50" y="100" font-family="Arial" font-weight="700" font-size="8" fill="#fff" text-anchor="middle">${anime1.title.romaji.substring(0, 20)}</text>
        <rect x="5" y="115" width="45" height="12" rx="3" fill="#2ecc71"/>
        <text x="27" y="124" font-family="Arial" font-size="7" fill="#fff" text-anchor="middle">ACTIVE</text>
      </g>

      <!-- Card 2 -->
      <g transform="translate(128, 60)">
        <image href="${img2}" width="100" height="140" clip-path="url(#clip2)" preserveAspectRatio="xMidYMid slice"/>
        <rect y="80" width="100" height="60" fill="#051a0d" fill-opacity="0.9"/>
        <text x="50" y="100" font-family="Arial" font-weight="700" font-size="8" fill="#fff" text-anchor="middle">${anime2.title.romaji.substring(0, 20)}</text>
        <rect x="5" y="115" width="45" height="12" rx="3" fill="#2ecc71"/>
        <text x="27" y="124" font-family="Arial" font-size="7" fill="#fff" text-anchor="middle">ACTIVE</text>
      </g>

      <rect y="208" width="800" height="22" fill="#0e0f13"/>
      <text x="20" y="223" font-family="Arial" font-size="9" fill="#888888">🎌 Fetching from AniList API</text>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).send(svg);

  } catch (err) {
    return res.status(500).send('<svg xmlns="http://www.w3.org/2000/svg"><text y="20" fill="red">Error loading anime data</text></svg>');
  }
}
