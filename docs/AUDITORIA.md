# Auditoría: código, arquitectura y diseño

Revisión completa de la V1 al cerrar el rediseño en claro. Primero el
desarrollo (arquitectura, código y configuración), después el diseño (color,
logotipo, cabecera y responsive) y por último la limpieza de todo lo que no
es Astro. Las decisiones de fondo están en DECISIONES.md (D47, D48 y D49);
aquí queda qué se revisó, qué se encontró y qué se cambió. La sección 5 es la
segunda auditoría, con el proyecto ya aplanado y las guías por situación (D50
y D51).

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

## 5. Segunda auditoría (28/09/2026)

Revisión completa tras decidir que la web será solo informativa, sin login ni
base de datos (D50), y al añadir las guías por situación (D51). Las rutas de
las secciones 1 a 4 son las de antes de aplanar el proyecto (`apps/web/…`);
ahora todo cuelga de la raíz.

### Cómo se ha comprobado

| Qué                | Cómo                                                                                                                                                        | Resultado                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Compilación        | `pnpm build`                                                                                                                                                | 16.513 páginas en 1 min 30 s, sin avisos                             |
| Enlaces internos   | Script que recorre todo `dist/`: cada `href` y `src` apunta a un fichero que existe y cada `#ancla` a un `id` real                                          | 0 rotos en las 16.513 páginas (antes, 1)                             |
| Enlaces externos   | Petición a cada URL distinta                                                                                                                                | 20 normas del BOE, Tu Europa y MAPA responden; el del INE no (abajo) |
| Responsive         | Chrome real por protocolo DevTools: 24 páginas a 360, 390, 768, 1024, 1280 y 1440 px, midiendo desbordamiento horizontal y errores de consola, con capturas | 144 combinaciones sin desbordamiento ni errores (antes, 1)           |
| Funcionamiento     | 18 pruebas en Chrome: filtro por animal, `?animal=`, recuento accesible, citas, consulta, idioma, 404, menú, buscador                                       | Todas pasan                                                          |
| Traducciones       | Paridad de claves es/en, listas y marcadores                                                                                                                | Sin diferencias                                                      |
| Código muerto      | Exportaciones sin uso, componentes sin importar, clases CSS sin uso, claves de traducción                                                                   | Lo encontrado, borrado (abajo)                                       |
| Contenido legal    | Citas contra el consolidado actual del BOE y búsqueda de normas estatales nuevas en su API                                                                  | Las 38 citas siguen literales; faltaba el RD 409/2025                |
| Lint, tipos, tests | `pnpm verificar`                                                                                                                                            | En verde                                                             |

### Hallazgos y cambios

| Área            | Hallazgo                                                                                                                                                    | Cambio                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Arquitectura    | Monorepo de dos paquetes solo para reutilizar el motor en una V2 que ya no va a existir                                                                     | Un solo proyecto Astro en la raíz; el motor en `src/lib/reglas/` con sus tests, ahora también con lint (D50)                      |
| Windows         | Con `core.autocrlf` la copia de trabajo sale en CRLF y `pnpm format:check` falla en los 137 ficheros                                                        | `.gitattributes` con LF para todo                                                                                                 |
| Dependencias    | Un `package-lock.json` de npm suelto junto al de pnpm                                                                                                       | Borrado                                                                                                                           |
| 404             | Canónica, hreflang y cambio de idioma apuntaban a `/en/404`, que no existe (el único enlace roto del sitio)                                                 | La 404 no declara versiones de idioma y el cambio de idioma lleva a la portada inglesa                                            |
| Tablet          | `/comunidades` a 768 px desbordaba 169 px: la tabla comparativa no cabía y aún no se apilaba                                                                | El apilado en tarjetas es ahora una utilidad (`apilada`) que cada tabla activa desde su ancho: esta, hasta 1023 px                |
| Móvil           | En la consulta, los pasos ya hechos eran botones de 6 px de alto                                                                                            | Área táctil de 24 px (WCAG 2.5.8) sin mover nada                                                                                  |
| Enlace externo  | «INE · Relación de municipios» (`/daco/daco42/codmun/`) devuelve 403: es una carpeta sin índice                                                             | Enlaza a la página vigente de INEbase. Las descargas del generador siguen funcionando                                             |
| Citas           | `FuentePlegable` omitía en silencio un artículo inexistente                                                                                                 | Rompe la compilación. `pnpm datos:comprobar` valida además los artículos de las guías por situación                               |
| Contenido legal | Faltaba el RD 409/2025 de perros de asistencia (estatal, en vigor desde el 17/06/2025). El art. 3.3 del RD 287/2002 estaba cortado                          | Añadido, con su entrada en `/cambios` y el RSS; art. 3.3 completo. Las normas estatales de 2026 del BOE son de animales de granja |
| Código muerto   | `totalMunicipios`, `buscarMunicipios` y `normasEstatales` sin uso; el estado «cumplido», de la V2 (casillas que marcaba el usuario); 5 claves de traducción | Borrados                                                                                                                          |
| Duplicación     | «Te mudas» en «Qué hacer si…» repetía lo que ahora cubre la guía de mudanza                                                                                 | Sustituido por un enlace a las situaciones                                                                                        |
| Buscador        | Las guías con página propia (PPP, seguro, multas, qué hacer si, preguntas) no se podían buscar                                                              | Entran en «Guías», junto a las de situación                                                                                       |

### Guías por situación

Nuevas páginas `/situaciones` y `/situaciones/{comprar-o-adoptar, mudanza,
viajar-por-espana, viajar-al-extranjero, perro-de-asistencia}` en los dos
idiomas, más una sección en la portada, un enlace en el menú y en el pie, y
enlaces personalizados al final del resultado de la consulta. 48 puntos, cada
obligación con su artículo literal (50 citas nuevas del BOE). Criterios en
D51.

### Revisión legal completa (29/09/2026)

Texto del BOE descargado de nuevo y articulado de las 17 leyes autonómicas
releído (D54 a D58):

| Hallazgo                                                                                                                 | Arreglo                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| El generador leía todas las versiones de cada artículo y seguía citando el seguro de Madrid, suprimido por la Ley 7/2024 | Solo la versión vigente; Madrid sin reglas propias                                                            |
| Cinco comunidades sin articulado revisado                                                                                | Identificación y censo en Baleares, Canarias, Cantabria, Castilla y León y Extremadura                        |
| Faltaban reglas en leyes ya cargadas                                                                                     | Censo en Andalucía y Asturias; identificación en Aragón, Murcia y País Vasco; aves en la Comunitat Valenciana |
| Sin identificación estatal (D52)                                                                                         | Art. 51.2 (perros, gatos, hurones y aves) y 51.1 (resto, pendiente)                                           |
| Perros de caza, pastoreo y trabajo con el seguro y el curso de la Ley 7/2023                                             | Fuera, por su art. 1.3.e                                                                                      |
| «Seguro de 120.000 €» y lista estatal de razas en toda España                                                            | Razas y seguros de cada comunidad (`ppp.json`)                                                                |
| Multas catalanas desfasadas: el BOE no había consolidado la Ley 11/2026                                                  | Cita desde la Ley 11/2026 y aviso automático para casos así                                                   |
| Ceuta y Melilla sin datos                                                                                                | Sus reglamentos como normas municipales                                                                       |

El motor dejaba en «sin datos» toda una comunidad si existía una regla
municipal de otra y no se sabía el municipio; ahora una regla de otra
comunidad o provincia se descarta (test en `resolver.test.ts`).

## 6. Pendiente

Antes de publicar:

- Dominio definitivo en `PUBLIC_SITE_URL` (en `.env.local`, en la raíz).
- Datos del titular (`TITULAR` en `src/lib/sitio.ts`).
- Proveedor de alojamiento, para nombrarlo en la política de privacidad.

Mejoras detectadas, sin urgencia (anotadas en IDEAS.md):

- La búsqueda de municipio no ordena por población: «alcala» muestra primero Alcalalí y no
  Alcalá de Henares.
- Un sprite de iconos reduciría casi un tercio del HTML de cada ficha.
