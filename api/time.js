// File: api/time.js

export default function handler(req, res) {
    // Grab the location from the URL query (e.g., ?loc=ph)
    const { loc } = req.query;

    const getTime = (tz) => new Date().toLocaleTimeString('en-US', { 
        timeZone: tz, 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });

    let text = "Time: UNAVAILABLE";
    let textColor = "#A9A9A9";
    let borderColor = "#696969";

    // Route based on the URL parameter
    if (!loc || loc.toLowerCase() === 'ph') {
        text = `PH Standard Time: ${getTime('Asia/Manila')}`;
        textColor = "#00E676"; // Green
        borderColor = "#00C853";
    } else if (loc.toLowerCase() === 'kr') {
        text = `KR Standard Time: ${getTime('Asia/Seoul')}`;
        textColor = "#B388FF"; // Purple
        borderColor = "#7C4DFF";
    } else if (loc.toLowerCase() === 'sg') {
        text = `SG Standard Time: ${getTime('Asia/Singapore')}`;
        textColor = "#FFD54F"; // Yellow
        borderColor = "#FFCA28";
    }

    const svg = `<svg width="300" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" rx="4" fill="#0d1117" stroke="${borderColor}" stroke-width="2"/>
        <text x="50%" y="50%" font-family="monospace" font-size="14" fill="${textColor}" dominant-baseline="middle" text-anchor="middle" font-weight="bold" letter-spacing="1">
            ${text}
        </text>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.status(200).send(svg);
}
