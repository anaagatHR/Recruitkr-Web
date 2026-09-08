import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://www.recruitkr.com';

  // Important static pages jo index karani hain
  const staticPages = [
    '/goal',
    '/success-stories',
    '/training',
  ];

  // Saari Discovered Job IDs (Total: 66)
  const jobIds = [
    '6a6d5dbe1ade991fb99b1ba0',
    '6a74219d7e8fcbcc84d76da7',
    '6a74219d7e8fcbcc84d76da8',
    '6a74219d7e8fcbcc84d76da9',
    '6a74219d7e8fcbcc84d76daa',
    '6a74219d7e8fcbcc84d76dab',
    '6a74219d7e8fcbcc84d76dac',
    '6a74219d7e8fcbcc84d76dad',
    '6a74219d7e8fcbcc84d76dae',
    '6a74219d7e8fcbcc84d76daf',
    '6a74219d7e8fcbcc84d76db0',
    '6a74219d7e8fcbcc84d76db1',
    '6a74219d7e8fcbcc84d76db2',
    '6a74219d7e8fcbcc84d76db3',
    '6a74219d7e8fcbcc84d76db4',
    '6a74219d7e8fcbcc84d76db5',
    '6a74219d7e8fcbcc84d76db6',
    '6a74219d7e8fcbcc84d76db7',
    '6a74219d7e8fcbcc84d76db8',
    '6a74219d7e8fcbcc84d76db9',
    '6a74219d7e8fcbcc84d76dba',
    '6a74219d7e8fcbcc84d76dbb',
    '6a74219d7e8fcbcc84d76dbc',
    '6a74219d7e8fcbcc84d76dbd',
    '6a74219d7e8fcbcc84d76dbe',
    '6a74219d7e8fcbcc84d76dbf',
    '6a74219d7e8fcbcc84d76dc0',
    '6a74219d7e8fcbcc84d76dc1',
    '6a74219d7e8fcbcc84d76dc2',
    '6a74219d7e8fcbcc84d76dc3',
    '6a74219d7e8fcbcc84d76dc4',
    '6a74219d7e8fcbcc84d76dc5',
    '6a74219d7e8fcbcc84d76dc6',
    '6a74219d7e8fcbcc84d76dc7',
    '6a74219d7e8fcbcc84d76dc8',
    '6a74219d7e8fcbcc84d76dc9',
    '6a74219d7e8fcbcc84d76dca',
    '6a74219d7e8fcbcc84d76dcb',
    '6a74219d7e8fcbcc84d76dcc',
    '6a74219d7e8fcbcc84d76dcd',
    '6a74219d7e8fcbcc84d76dce',
    '6a74219d7e8fcbcc84d76dcf',
    '6a74219d7e8fcbcc84d76dd0',
    '6a74219d7e8fcbcc84d76dd1',
    '6a74219d7e8fcbcc84d76dd2',
    '6a74219d7e8fcbcc84d76dd3',
    '6a74219d7e8fcbcc84d76dd4',
    '6a74219d7e8fcbcc84d76dd5',
    '6a74219d7e8fcbcc84d76dd6',
    '6a74219d7e8fcbcc84d76dd7',
    '6a74219d7e8fcbcc84d76dd8',
    '6a74219d7e8fcbcc84d76dd9',
    '6a74219d7e8fcbcc84d76dda',
    '6a74219d7e8fcbcc84d76ddb',
    '6a74219d7e8fcbcc84d76ddc',
    '6a74219d7e8fcbcc84d76ddd',
    '6a74219d7e8fcbcc84d76dde',
    '6a74219d7e8fcbcc84d76ddf',
    '6a74219d7e8fcbcc84d76de0',
    '6a74219d7e8fcbcc84d76de1',
    '6a74219d7e8fcbcc84d76de2',
    '6a74219d7e8fcbcc84d76de3',
    '6a74219d7e8fcbcc84d76de4',
    '6a74219d7e8fcbcc84d76de5',
    '6a74219d7e8fcbcc84d76de6',
    '6a74219d7e8fcbcc84d76de7',
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (path) => `  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}
${jobIds
  .map(
    (id) => `  <url>
    <loc>${baseUrl}/jobs/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
