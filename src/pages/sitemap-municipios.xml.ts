import type { APIRoute } from 'astro';
import { todosLosMunicipios, ultimaVerificacion } from '@/lib/datos';
import { sitemap } from '@/lib/sitemap';

/** Las 8.132 fichas de municipio. */
export const GET: APIRoute = () => {
  const fecha = ultimaVerificacion();
  return sitemap(
    todosLosMunicipios().map((m) => ({ ruta: `/municipios/${m.slug}`, fecha })),
  );
};
