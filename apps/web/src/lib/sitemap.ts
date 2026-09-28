import { alternativas, urlAbsoluta } from './seo';

/**
 * Sitemap XML con la version de cada idioma declarada en xhtml:link
 * (https://developers.google.com/search/docs/specialty/international/localized-versions).
 */
export function sitemap(entradas: { ruta: string; fecha?: string | null }[]) {
  const urls = entradas.flatMap(({ ruta, fecha }) =>
    (['es', 'en'] as const).map((idioma) => {
      const enlaces = alternativas(ruta)
        .map(
          (a) =>
            `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`,
        )
        .join('\n');
      return `  <url>\n    <loc>${urlAbsoluta(ruta, idioma)}</loc>\n${fecha ? `    <lastmod>${fecha}</lastmod>\n` : ''}${enlaces}\n  </url>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
