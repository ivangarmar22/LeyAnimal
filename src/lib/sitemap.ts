import { urlAbsoluta } from './seo';

/** Sitemap XML (https://www.sitemaps.org/protocol.html). */
export function sitemap(entradas: { ruta: string; fecha?: string | null }[]) {
  const urls = entradas.map(
    ({ ruta, fecha }) =>
      `  <url>\n    <loc>${urlAbsoluta(ruta)}</loc>\n${fecha ? `    <lastmod>${fecha}</lastmod>\n` : ''}  </url>`,
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
