import type { APIRoute } from 'astro';
import { URL_SITIO } from '@/lib/sitio';

/** Indice de sitemaps: paginas y contenido por un lado, municipios por otro. */
export const GET: APIRoute = () => {
  const mapas = ['sitemap-paginas.xml', 'sitemap-municipios.xml']
    .map(
      (f) =>
        `  <sitemap><loc>${new URL(`/${f}`, URL_SITIO).toString()}</loc></sitemap>`,
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${mapas}\n</sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
