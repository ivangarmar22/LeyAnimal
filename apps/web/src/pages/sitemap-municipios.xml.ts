import type { APIRoute } from 'astro';
import { todosLosMunicipios, ultimaVerificacion } from '@/lib/datos';
import { sitemap } from '@/lib/sitemap';

/** 8.132 municipios x 2 idiomas: por debajo del limite de 50.000 URL. */
export const GET: APIRoute = () => {
  const fecha = ultimaVerificacion();
  return sitemap(
    todosLosMunicipios().map((m) => ({ ruta: `/municipios/${m.slug}`, fecha })),
  );
};
