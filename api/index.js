import { handleApi } from '../atlas/service.mjs';
import { getDb } from './db.js';

export default async function handler(req, res) {
  try {
    const host = req.headers.host || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const matchedPath = req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'];
    let reqPath = req.url;
    if (matchedPath && (matchedPath.startsWith('/api') || matchedPath.startsWith('/media'))) {
      const qIdx = req.url.indexOf('?');
      reqPath = matchedPath + (qIdx >= 0 ? req.url.slice(qIdx) : '');
    }
    const url = new URL(reqPath, `${proto}://${host}`);

    // Support TMDB image proxying for /media/...
    if (url.pathname.startsWith('/media/')) {
      const match = url.pathname.match(/^\/media\/(w92|w185|w342|w500|w1280)\/([A-Za-z0-9_]+\.(?:jpg|png))$/);
      if (!match) {
        res.statusCode = 404;
        return res.end('Image not found');
      }
      try {
        const tmdbRes = await fetch(`https://image.tmdb.org/t/p/${match[1]}/${match[2]}`);
        res.statusCode = tmdbRes.status;
        res.setHeader('Content-Type', tmdbRes.headers.get('Content-Type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
        const buf = Buffer.from(await tmdbRes.arrayBuffer());
        return res.end(buf);
      } catch (err) {
        console.error('TMDB media proxy failed:', err.message);
        res.statusCode = 502;
        return res.end('Media unavailable');
      }
    }

    const bodyChunks = [];
    for await (const chunk of req) bodyChunks.push(chunk);
    const hasBody = !['GET', 'HEAD'].includes(req.method) && bodyChunks.length > 0;

    const standardRequest = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      ...(hasBody ? { body: Buffer.concat(bodyChunks), duplex: 'half' } : {})
    });

    const env = {
      ...process.env,
      DB: getDb()
    };

    const ctx = {
      waitUntil: p => Promise.resolve(p).catch(err => console.error('Background task error:', err))
    };

    const response = await handleApi(standardRequest, env, ctx);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const respBuffer = Buffer.from(await response.arrayBuffer());
    return res.end(respBuffer);
  } catch (err) {
    console.error('Vercel API request error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
