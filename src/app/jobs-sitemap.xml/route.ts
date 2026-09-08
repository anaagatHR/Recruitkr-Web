import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://www.recruitkr.com';

  // Job IDs jo Google Search Console me discovered hain
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
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${jobIds
    .map(
      (id) => `
    <url>
      <loc>${baseUrl}/jobs/${id}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`
    )
    .join('')}
</urlset>`;

  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
