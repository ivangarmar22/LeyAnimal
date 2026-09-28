# LeyAnimal

Aplicación web que responde a una pregunta concreta: **¿qué me obliga a mí, hoy,
en mi municipio, con este animal?**

Para cada obligación se muestra su estado real (obligatoria, obligatoria pero
pendiente de reglamento, recomendada, no aplica o sin datos verificados), el
ámbito que la impone, la norma y el artículo concretos con la cita literal y el
enlace a la fuente oficial, y la fecha de última verificación.

> Información divulgativa. No es asesoramiento jurídico.

## Estado: V1 informativa

La V1 es una web informativa con buscador y consulta, **sin cuentas de usuario
ni base de datos** (DECISIONES.md, D39 y D49). Es un sitio
**100 % estático** hecho con Astro: todas las páginas, incluidas las 8.132
fichas de municipio en los dos idiomas, se generan al compilar, y lo
interactivo (consulta, buscador, verificador…) son islas Preact que calculan en
el navegador con el mismo motor de reglas (D48). Incluye:

- Consulta en 4 pasos (`/consulta`) con resultado calculado por el motor de
  reglas, traza «¿Por qué me sale esto?», impresión y enlace para compartir.
- Normativa (`/normativa`) con explorador y ficha por norma.
- Guías por tema (`/temas`), comunidades, provincias y las 8.132 fichas de
  municipio, mapa por comunidades.
- Verificador de perros potencialmente peligrosos, guía del seguro, calculadora
  de multas con tramos literales, «Qué hacer si…», preguntas frecuentes.
- Cambios normativos con RSS, metodología, colabora, páginas legales.
- Español e inglés. Tema claro, oscuro y del sistema.

Lo relativo a usuarios (área privada, avisos por email, panel de
administración) queda para la V2 (IDEAS.md).

## Requisitos

| Herramienta | Versión     | Nota                           |
| ----------- | ----------- | ------------------------------ |
| Node.js     | 24.20.0 LTS | Astro 7 exige 22.12 o superior |
| pnpm        | 11.25.0     | Gestor del monorepo            |

No hace falta base de datos ni Docker: el contenido legal son ficheros JSON
dentro de la web (ver «Contenido legal»).

## Arranque local

```bash
pnpm install
cp .env.example apps/web/.env.local   # solo PUBLIC_SITE_URL
pnpm dev                               # http://localhost:4321
```

Para ver la versión de producción: `pnpm build` (unos 3 minutos: genera
unas 16.500 páginas en `apps/web/dist/`) y después `pnpm start`.

## Despliegue

`apps/web/dist/` es una carpeta de ficheros estáticos: vale cualquier
alojamiento estático (Cloudflare Pages, Netlify, Vercel…). Hay que configurar
`PUBLIC_SITE_URL` con el dominio definitivo antes de compilar, porque se usa en
canónicas, hreflang, sitemap, RSS e imagen social. Ocupa alrededor de 1,1 GB en
unos 16.600 ficheros (13 KB por ficha de municipio con gzip): conviene un
alojamiento sin límite bajo de tamaño total (GitHub Pages recomienda 1 GB).

## Comandos

| Comando                  | Qué hace                                                         |
| ------------------------ | ---------------------------------------------------------------- |
| `pnpm dev`               | Servidor de desarrollo de la web                                 |
| `pnpm build`             | Genera el sitio estático en `apps/web/dist/`                     |
| `pnpm start`             | Sirve el sitio compilado para revisarlo                          |
| `pnpm og`                | Regenera las imágenes para compartir (necesita Chrome)           |
| `pnpm lint`              | ESLint en todos los paquetes                                     |
| `pnpm typecheck`         | `astro check` en la web y `tsc --noEmit` en el motor             |
| `pnpm test`              | Tests de todos los paquetes (motor de reglas)                    |
| `pnpm verificar`         | Formato + contenido legal + lint + tipos + tests, antes de subir |
| `pnpm format`            | Formatea todo el repositorio con Prettier                        |
| `pnpm datos:comprobar`   | Comprueba el contenido legal (fuentes, citas, referencias)       |
| `pnpm datos:autonomicas` | Citas autonómicas desde el BOE (`--escribir` para guardarlas)    |
| `pnpm datos:referencia`  | Artículos estatales de referencia desde el BOE                   |
| `pnpm datos:geografia`   | Comunidades, provincias y municipios desde el INE                |
| `pnpm datos:extraer`     | Ficha de revisión de las leyes autonómicas (`docs/`)             |

## Estructura

```
apps/web/
  src/pages/[...lang]/   Todas las páginas, por idioma (es sin prefijo, en en /en)
  src/pages/             Sitemaps, RSS, robots.txt, 404 y los JSON que
                         descargan las islas (datos/municipios.json…)
  src/layouts/           Plantilla común: cabecera, pie y SEO de cada página
  src/componentes/       Piezas .astro sin JavaScript: layout, marca, inicio,
                         pagina, obligaciones, legal, seo
  src/islas/             Componentes Preact que se hidratan en el navegador
  src/ui/                Piezas Preact compartidas (chips, cita, combobox…)
  src/datos/             Contenido en JSON (ver «Contenido legal»)
  src/lib/datos/         Acceso al contenido, evaluación y búsqueda
  src/i18n/              Traductor propio y catálogos {es,en} por área
  src/estilos/global.css Paleta, tipografía y piezas visuales (Tailwind 4)
  src/scripts/           Efectos de scroll y animaciones (sin framework)
  src/assets/fotos/      Fotografías de Unsplash, con sus créditos
  public/                Fuentes, favicon e imágenes para compartir
  scripts/contenido/     Generadores desde el BOE y el INE, y comprobación
  scripts/generar-og.mjs Imágenes para compartir (public/og/)
packages/reglas/         MOTOR DE REGLAS. TypeScript puro, sin dependencias
docs/                    Fichas de verificación legal y auditoría
```

## Contenido legal

Vive en `apps/web/src/datos/`, repartido según su origen:

| Fichero                   | Origen                                                      |
| ------------------------- | ----------------------------------------------------------- |
| `estatal.json`            | A mano: normas estatales, requisitos, reglas y sus fuentes  |
| `autonomico.json`         | BOE, con `pnpm datos:autonomicas --escribir`                |
| `referencia-estatal.json` | BOE, con `pnpm datos:referencia`                            |
| `geografia.json`          | INE, con `pnpm datos:geografia` (junto a `municipios.json`) |
| `catalogo.json`           | A mano: especies, razas y temas                             |
| `cambios.json`            | A mano: cambios normativos publicados                       |

Para añadir una obligación autonómica:

1. Añade a la selección de `scripts/contenido/generar-autonomicas.mjs` la
   norma, el artículo, la frase que localiza la cita y las especies a las que
   se aplica. El texto no se copia a mano: el script lo extrae del consolidado
   del BOE.
2. `pnpm datos:autonomicas` muestra la tabla para revisar;
   `pnpm datos:autonomicas --escribir` la guarda.
3. `pnpm datos:comprobar`: ninguna obligación sin fuente, ninguna cita que no
   esté literalmente en su artículo, ninguna regla sin especies.
4. Revisa el diff de los JSON y documenta en DECISIONES.md cualquier criterio
   que no sea evidente.

En `estatal.json` la cita se copia del texto del artículo que se guarda al
lado; la comprobación falla si no aparece literalmente en él.

Regla fija: ninguna afirmación legal entra en la aplicación sin norma,
artículo, enlace oficial y fecha de verificación.

## Idiomas

Español (por defecto, sin prefijo en la URL) e inglés (bajo `/en`). Se traducen
la interfaz, las explicaciones y las guías. **El texto literal de las normas se
muestra siempre en español**, marcado con su idioma, porque una traducción no es
el texto legal.

## Pendiente antes de publicar

- Email de contacto definitivo (`EMAIL_CONTACTO` en `apps/web/src/lib/sitio.ts`).
- Datos del titular para el aviso legal (`TITULAR` en el mismo fichero).
- `PUBLIC_SITE_URL` con el dominio definitivo.
- Proveedor de alojamiento, para nombrarlo en la política de privacidad.
