// File: api/status.js

export default async function handler(req, res) {
    const gistUrl = "https://gist.githubusercontent.com/glzzjhn-byte/e984e5ecad79ae1d389924d8a9b19851/raw/status";
    
    // Default fallback state
    let text = "System Status: UNAVAILABLE 🚫";
    let textColor = "#A9A9A9"; 
    let borderColor = "#696969";

    try {
        // Fetch the Gist
        const response = await fetch(gistUrl);
        const statusText = await response.text();
        const status = statusText.trim().toLowerCase();

        // Process logic
        if (status === 'yes') {
            text = "System Status: ONLINE &amp; FREE";
            textColor = "#00BFFF";
            borderColor = "#00599C";
        } else if (status === 'no') {
            text = "System Status: BUSY // DO NOT DISTURB";
            textColor = "#D14836";
            borderColor = "#8B0000";
        }
    } catch (error) {
        // If fetch fails, defaults remain active
    }

    // Render SVG
    const svg = `<svg width="350" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" rx="4" fill="#0d1117" stroke="${borderColor}" stroke-width="2"/>
        <text x="50%" y="50%" font-family="monospace" font-size="14" fill="${textColor}" dominant-baseline="middle" text-anchor="middle" font-weight="bold" letter-spacing="1">
            ${text}
        </text>
    </svg>`;

    // Force strict caching rules and set content type to SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.status(200).send(svg);
}
