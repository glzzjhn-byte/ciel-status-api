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
    const list = json.data.MediaListCollection.lists[0].entries.slice(0, 2); 
    const anime1 = list[0]?.media || { title: { romaji: "N/A" }, coverImage: { extraLarge: "" } };
    const anime2 = list[1]?.media || { title: { romaji: "N/A" }, coverImage: { extraLarge: "" } };

    const svg = `
    <svg width="800" height="230" viewBox="0 0 800 230" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="clip"><rect x="0" y="0" width="100" height="140" rx="6"/></clipPath>
      </defs>
      <rect width="800" height="230" rx="10" fill="#141519"/>
      <rect width="800" height="4" rx="2" fill="#F47521"/>
      <text x="20" y="33" font-family="Arial" font-weight="800" font-size="15" fill="#F47521">CRUNCHYROLL</text>
      <text x="145" y="33" font-family="Arial" font-size="12" fill="#aaaaaa">— Real-time Status</text>
      
      <!-- Card 1 -->
      <g transform="translate(16, 60)">
        <image href="${anime1.coverImage.extraLarge}" width="100" height="140" clip-path="url(#clip)" preserveAspectRatio="xMidYMid slice"/>
        <rect y="80" width="100" height="60" fill="#0a1c36" fill-opacity="0.9"/>
        <text x="50" y="100" font-family="Arial" font-weight="700" font-size="8" fill="#fff" text-anchor="middle">${anime1.title.romaji.substring(0, 20)}</text>
        <rect x="5" y="115" width="45" height="12" rx="3" fill="#2ecc71"/>
        <text x="27" y="124" font-family="Arial" font-size="7" fill="#fff" text-anchor="middle">ACTIVE</text>
      </g>

      <!-- Card 2 -->
      <g transform="translate(128, 60)">
        <image href="${anime2.coverImage.extraLarge}" width="100" height="140" clip-path="url(#clip)" preserveAspectRatio="xMidYMid slice"/>
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
    return res.status(500).send('<svg>...</svg>');
  }
}
