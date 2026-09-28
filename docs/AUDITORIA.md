# Auditoría: código, arquitectura y diseño

Revisión completa de la V1 al cerrar el rediseño en claro. Primero el
desarrollo (arquitectura, código y configuración), después el diseño (color,
logotipo, cabecera y responsive) y por último la limpieza de todo lo que no
es Astro. Las decisiones de fondo están en DECISIONES.md (D47, D48 y D49);
aquí queda qué se revisó, qué se encontró y qué se cambió.

## 1. Arquitectura

**Decisión: la web pasa de Next.js 16 a Astro 7, como sitio 100 % estático.**

La V1 no tiene cuentas y el contenido legal vive en JSON dentro del propio
repositorio. Next obligaba a mantener un servidor para cosas que no lo
necesitan:

| Pieza                    | Con Next                            | Con Astro                                                      |
| ------------------------ | ----------------------------------- | -------------------------------------------------------------- |
| Fichas de municipio      | Generadas bajo demanda (ISR)        | Las 16.264 (dos idiomas) generadas al compilar                 |
| Buscador y consulta      | Acciones de servidor                | En el navegador, con el mismo motor de reglas                  |
| Idioma                   | Cookie de next-intl                 | Solo la URL. Sin cookies                                       |
| HTML de la portada       | 231 KB (con la carga RSC duplicada) | 101 KB (18 KB con gzip)                                        |
| JavaScript de la portada | Más de 100 KB                       | 45 KB (20 KB con gzip), cargado cuando el navegador está libre |
| Alojamiento              | Servidor Node                       | Cualquier alojamiento estático                                 |

Las URL no cambian (`/consulta`, `/en/municipios/malaga`), así que no hay que
redirigir nada.

La compilación genera 16.497 páginas en unos 3,5 minutos. La carpeta publicada
ocupa 1,1 GB en 16.600 ficheros: cabe sin problema en Cloudflare Pages, Netlify
o Vercel, pero supera la recomendación de 1 GB de GitHub Pages.

**Para la V2** (cuentas, avisos por email): Astro permite añadir rutas con
servidor junto a las estáticas, o se puede montar una aplicación aparte. El
motor de reglas (`packages/reglas`) y los datos no dependen del framework.

## 2. Código y configuración

| Área           | Hallazgo                                                                                                                   | Cambio                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Dependencias   | Paquetes que solo existían por Next (next-intl, react, radix, clsx, tailwind-merge, zod…)                                  | Eliminados. El lockfile pierde 197 paquetes                                    |
| Tipos          | —                                                                                                                          | `astro check` en modo estricto: 0 errores, 0 avisos en 100 ficheros            |
| Lint           | No había configuración para `.astro` ni para Preact                                                                        | ESLint con typescript-eslint (estricto), eslint-plugin-astro y reglas de hooks |
| Aserciones `!` | Cinco páginas asumían que el slug existía                                                                                  | Comprobación explícita: la compilación falla con un mensaje claro              |
| Clases CSS     | Sin tailwind-merge, `hidden` y `inline-flex` en el mismo elemento se pisaban: un chip que debía ocultarse en móvil se veía | Corregido; los componentes ya no reciben clases que choquen con las suyas      |
| Variables      | La configuración de Astro no leía `.env.local`                                                                             | Se carga con la función nativa de Node, sin dependencias                       |
| Números        | «8132» en unas partes y «8.132» en otras                                                                                   | Separador de miles siempre                                                     |
| Formato        | Prettier no entendía `.astro`                                                                                              | prettier-plugin-astro configurado; todo el repositorio pasa `format:check`     |
| Imagen social  | Las páginas apuntaban a `/og/es.png` y `/og/en.png`, que no existían                                                       | Generadas (`pnpm og`) con el logotipo y el titular de cada idioma              |
| Textos propios | Tres notas explicativas usaban comillas rectas                                                                             | Comillas españolas (y tipográficas en inglés). El texto legal no se ha tocado  |

Resultado de `pnpm verificar`: formato, contenido legal, lint, tipos y los 40
tests del motor en verde.

## 3. Diseño

### Color

Paleta «Hoja»: fondo blanco, una sola familia de verdes y un tono cálido solo
para detalles. Se midieron todos los pares de color de los dos temas contra
WCAG 2.2 AA; ninguno falla (tabla completa en D47). El verde 600 es
para botones con texto blanco (4,96:1); para texto y enlaces se usa el 700
(6,54:1 sobre blanco y 6,12:1 sobre menta).

El verde se usa para lo que se puede pulsar y para marcar lo verificado. Los
estados legales (obligatorio, pendiente, sin datos…) conservan sus propios
colores, siempre con icono y texto, para no depender solo del color.

### Logotipo

Escudo partido con huella: la mitad izquierda maciza y la derecha a trazo, y la
huella cambia de color al cruzar el eje. Se lee como marca y no como icono de
aplicación porque no va dentro de una baldosa y el nombre comparte eje con el
símbolo. Para tamaños muy pequeños (favicon) hay una variante maciza.

**Alineación en la cabecera**, medida sobre la tinta real de las letras a 3×:
centro del símbolo 38,3 px, centro de «LeyAnimal» 37,0 px y centro de los
enlaces 38,5 px, con las líneas base a 1 px. El desfase que se veía en la
versión anterior venía de que el enlace del logotipo se alineaba por la línea
base y no por el centro.

### Responsive

Revisado a 360, 768, 1024, 1280 y 1440 px, en claro y oscuro, en español e
inglés, con el menú móvil y el buscador abiertos.

| Dónde                                   | Problema                                                                                     | Solución                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Portada, «Cómo funciona» (móvil)        | La línea que une los pasos atravesaba el texto                                               | Número a la izquierda y texto a la derecha                                    |
| Portada, panel final (360 px)           | El botón «Consultar mis obligaciones» se salía del panel                                     | Botón a todo el ancho; puede partir el texto en dos líneas                    |
| Portada, selector de especie            | «Otra especie» quedaba apretada junto al icono                                               | En móvil, icono encima del texto                                              |
| Portada, hero (1024 px)                 | Dos columnas demasiado estrechas: titular en cuatro líneas y el campo de municipio cortado   | Dos columnas desde 1280 px; por debajo, la maqueta va debajo                  |
| Portada, hero (escritorio)              | La maqueta inclinada torcía y emborronaba su texto; el titular pesaba demasiado junto a ella | Inclinación más leve (ninguna con movimiento reducido) y titular algo menor   |
| Consulta, barra inferior (360 px)       | «Ver mis obligaciones» se salía de la pantalla junto a «Atrás»                               | Por debajo de 420 px, «Atrás» queda solo con la flecha (con nombre accesible) |
| Fichas de municipio y comunidad (móvil) | Tres rellenos anidados dejaban la cita legal a una o dos palabras por línea                  | Menos relleno en móvil                                                        |
| Ficha de norma (360 px)                 | 2 px de desplazamiento horizontal por un título que no cabía junto a sus etiquetas           | El título baja a su propia línea cuando no cabe                               |
| Menú móvil                              | Tapaba el logotipo y el botón de cerrar, y dejaba ver la página de detrás                    | Fondo opaco; logotipo y botón por encima del panel                            |
| Cabecera al hacer scroll                | El efecto cristal no funcionaba y el texto se leía nítido detrás de la cabecera              | Arreglado (una propiedad de transición entre páginas lo anulaba)              |

## 4. Limpieza: fuera Supabase y todo lo que no es Astro

La carpeta `supabase/` mezclaba dos cosas: lo propio de Supabase (CLI,
esquema con políticas RLS, migraciones y pruebas de la V2) y la cadena del
contenido legal (generadores desde el BOE y el INE, y sus comprobaciones), que
cargaba SQL en un Postgres en memoria solo para exportarlo a JSON. Lo primero
se ha borrado; lo segundo se ha convertido para trabajar directamente sobre
JSON (D49).

| Se ha quitado                                                                              | Qué hace ahora ese trabajo                                                                     |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `supabase/` completo (config, migraciones, seeds, V2)                                      | Los JSON de `apps/web/src/datos/` son la fuente de verdad                                      |
| Exportador SQL → JSON y su comprobación                                                    | No hace falta: los generadores escriben JSON                                                   |
| Restricciones del esquema y pruebas de contenido                                           | `pnpm datos:comprobar`, con una comprobación nueva: cada cita está literalmente en su artículo |
| `@electric-sql/pglite` y el CLI de `supabase`                                              | —                                                                                              |
| Scripts `db:*` de la raíz                                                                  | `datos:*`                                                                                      |
| Permisos de instalación de `@swc/core`, `@parcel/watcher` y `unrs-resolver` (eran de Next) | —                                                                                              |
| Carpetas vacías `content/`, `tests/` y `componentes/territorio/`                           | —                                                                                              |

La conversión se verificó contra lo que exportaba Postgres: las 20 normas, 60
artículos, 6 requisitos, 18 reglas y 21 fuentes salen iguales campo a campo y
en el mismo orden, y la geografía, los municipios, el catálogo y los cambios,
byte a byte. Una prueba negativa confirmó que la comprobación rechaza una
regla sin fuente y una cita alterada.

Auditoría del código de la web tras la limpieza:

| Qué se buscó                                      | Resultado                                                                                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Ficheros que nadie importa                        | Ninguno                                                                                                                                       |
| Funciones exportadas sin uso                      | `rutaBase`, borrada. Cuatro funciones y una constante que solo se usaban en su fichero dejan de exportarse                                    |
| Claves de traducción sin uso (en los dos idiomas) | 18 borradas: la página de error de Next (4), nueve textos comunes, dos del asistente, `especiesPlural` (2) y una fecha de las páginas legales |
| Clases CSS sin uso                                | Dos variantes de botón (`--fantasma` y `--suave`), borradas                                                                                   |
| Recursos sin uso                                  | `gatito.jpg` (solo aparecía en los créditos), borrada con su crédito                                                                          |
| Dependencias                                      | Todas se usan. `zod` y `clsx` siguen en el lockfile porque las trae Astro                                                                     |
| Referencias a Next, Supabase, SQL o Postgres      | Ninguna en código ni configuración; solo en DECISIONES.md, que es el historial                                                                |
| Configuración                                     | `engines` pedía Node 22.0 y Astro exige 22.12: corregido                                                                                      |

Se mantiene `packages/reglas` como paquete aparte: es el motor, no depende
del framework y tiene sus propios tests; es lo que se reutilizará en la V2.

## 5. Pendiente

Antes de publicar:

- Dominio definitivo en `PUBLIC_SITE_URL` (ahora `apps/web/.env.local` tiene
  `http://localhost:3000`).
- Email de contacto y datos del titular (`apps/web/src/lib/sitio.ts`).
- Proveedor de alojamiento, para nombrarlo en la política de privacidad.

Mejoras detectadas, sin urgencia (anotadas en IDEAS.md):

- El buscador no ordena por población: «alcala» muestra primero Alcalalí y no
  Alcalá de Henares.
- Un sprite de iconos reduciría casi un tercio del HTML de cada ficha.
