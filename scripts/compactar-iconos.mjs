import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Integracion de Astro que adelgaza los iconos de Lucide en el HTML generado.
 *
 * Cada icono repite los mismos nueve atributos (tamano, trazo, xmlns) y una
 * ficha de municipio lleva decenas: con 16.000 paginas, eso solo eran cientos
 * de megas y el sitio no cabia en GitHub Pages (1 GB). Los atributos pasan a
 * una regla CSS equivalente (`svg.lucide` en global.css) y los elementos SVG
 * vacios se cierran con "/>".
 */
const ATRIBUTOS =
  ' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const CIERRES =
  /<(path|circle|rect|line|polyline|polygon|ellipse)([^<>]*)><\/\1>/g;

export function compactar(html) {
  return html
    .replaceAll(ATRIBUTOS, ' viewBox="0 0 24 24"')
    .replace(CIERRES, '<$1$2/>');
}

async function* paginas(dir) {
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) yield* paginas(ruta);
    else if (entrada.name.endsWith('.html')) yield ruta;
  }
}

export default function compactarIconos() {
  return {
    name: 'leyanimal:compactar-iconos',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let antes = 0;
        let despues = 0;
        for await (const ruta of paginas(fileURLToPath(dir))) {
          const html = await readFile(ruta, 'utf8');
          const nuevo = compactar(html);
          antes += html.length;
          despues += nuevo.length;
          if (nuevo !== html) await writeFile(ruta, nuevo);
        }
        const mb = (n) => (n / 1e6).toFixed(0);
        logger.info(`HTML: ${mb(antes)} MB -> ${mb(despues)} MB`);
      },
    },
  };
}
