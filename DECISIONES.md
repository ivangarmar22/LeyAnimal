# Decisiones técnicas

Cada entrada recoge qué se decidió, por qué, y qué alternativa se descartó.
Orden cronológico.

---

## Fase 0

### D1. Monorepo con pnpm workspaces

`apps/web` para la aplicación Next y `packages/reglas` para el motor de reglas.

**Por qué**: el §2 del brief exige que el motor de reglas sea TypeScript puro,
sin dependencias y sin acoplarse a Next ni a Supabase, para reutilizarlo en la
futura app móvil. Un paquete separado convierte ese requisito en algo que el
compilador verifica, en lugar de una convención que se erosiona sola. El
`tsconfig.json` de `packages/reglas` declara `lib: ["ES2022"]` sin `DOM`, así
que cualquier referencia accidental al navegador falla al compilar.

**Consecuencia sobre el brief**: la ruta `src/lib/reglas` del §2 pasa a ser
`packages/reglas`. El resto de la estructura se mantiene bajo `apps/web/src`.

### D2. Next.js 16.3.4 en lugar de Next 15

**Por qué**: el §2 fijaba Next 15, pero al arrancar el proyecto la versión
`latest` era 16.3.4 y la rama 15 ya solo recibía backports (15.5.25). Consultado
y aprobado: arrancar un proyecto nuevo sobre una rama en mantenimiento obligaba
a una migración a corto plazo.

**Cambios de Next 16 que afectan a lo escrito en el brief**, verificados en la
guía de actualización que Next instala en `node_modules/next/dist/docs`:

| Brief                                                   | Realidad en Next 16                                                                                                                                                          |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §10 «Middleware de Next protege /app y /admin»          | El fichero se llama ahora `proxy.ts` y exporta `proxy`. El runtime es `nodejs` y no es configurable, lo que encaja bien con `@supabase/ssr`                                  |
| §9 «Revalidación al publicar cambios (`revalidateTag`)» | `revalidateTag` exige ahora un segundo argumento con el perfil de `cacheLife`. Para semántica de lectura inmediata tras escritura existe `updateTag`, solo en Server Actions |
| —                                                       | `params`, `searchParams`, `cookies()` y `headers()` son solo asíncronos. Ya no hay acceso síncrono                                                                           |
| —                                                       | Turbopack es el bundler por defecto en `dev` y en `build`                                                                                                                    |
| —                                                       | `next lint` desaparece. Se invoca ESLint directamente                                                                                                                        |

### D3. next-intl para la internacionalización

**Por qué**: se pidió español e inglés. `next-intl@4.14.2` declara
`next: ^16.0.0` en sus `peerDependencies`, verificado antes de instalarla, y la
propia documentación de Next la lista como opción. Aporta formato ICU de fechas,
números y plurales por idioma, que en importes de sanciones y fechas de
verificación se nota.

**Alternativa descartada**: diccionarios propios sin dependencia. Habría exigido
resolver plurales y formato a mano.

**Pendiente de revisar**: `getRequestConfig` recibe `requestLocale`, que
next-intl marca como deprecado en favor de `next/root-params` (una API nueva de
Next 16). Funciona, pero conviene migrarlo cuando la integración esté asentada.

### D4. `localePrefix: 'as-needed'`

El español, mercado principal, conserva URLs limpias (`/consulta`,
`/municipios/malaga`) y el inglés vive bajo `/en`.

**Por qué**: el producto depende del SEO local en español (§9). Prefijar todas
las URLs españolas con `/es` habría partido esa estrategia sin ganar nada.

**Es reversible**: se cambia en `apps/web/src/i18n/routing.ts`.

### D5. Alcance del inglés

Se traducen interfaz, explicaciones y guías. El texto literal de las normas se
muestra siempre en su idioma oficial.

**Por qué**: una traducción de un artículo de ley no es el texto legal.
Presentarla como tal es exactamente el tipo de afirmación que el §0 prohíbe.

**Consecuencia sobre el modelo de datos (fase 2)**: las columnas traducibles
serán las nuestras (`descripcion_corta`, `explicacion_md`, títulos de temas), no
las de `norma_articulos.texto_literal`.

### D6. Node 24.20.0 LTS y pnpm 11.25.0

Node 24 es la LTS vigente. Next 16 exige 20.9 o superior. pnpm por los
workspaces y por velocidad de instalación.

### D7. Scripts de instalación denegados para `@swc/core` y `@parcel/watcher`

Ambos entran como dependencias directas de `next-intl`. Se deniegan sus scripts
de instalación en `pnpm-workspace.yaml`, siguiendo el criterio conservador que
`create-next-app` ya aplicaba a `sharp` y `unrs-resolver`.

Build, tipos y lint pasan con ellos denegados. Si el vigilante de mensajes en
desarrollo fallara, hay que poner `'@parcel/watcher': true`.

### D8. `typedRoutes: true`

Las rutas quedan tipadas. Con la cantidad de rutas dinámicas que tendrá el sitio
(municipios, provincias, comunidades, normas, temas), un enlace roto debe fallar
al compilar y no en producción.

### D9. Decisiones de producto ya cerradas, pendientes de implementar

| Tema               | Decisión                                                                                                                                                                                                                        | Fase |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Rol admin          | Tabla `roles` + función `es_admin()` `security definer` usada en las políticas RLS. El claim en `app_metadata` viaja dentro del JWT y no se revoca hasta refrescar el token; la tabla da revocación inmediata y queda auditable | 2    |
| Cron               | Vercel Cron llamando a un route handler protegido por secreto. Las plantillas react-email, el cliente de Resend y los tipos de dominio ya viven en el repo; con Edge Functions en Deno habría que duplicar esa lógica           | 7    |
| Remitente de email | Subdominio dedicado (`avisos.<dominio>`), para que un problema de reputación en envíos masivos no arrastre al dominio principal                                                                                                 | 7    |
| Analytics          | Ninguno hasta tener tráfico. Sin banner de cookies                                                                                                                                                                              | —    |
| `/seguros`         | Informativo puro, sin enlaces de afiliación                                                                                                                                                                                     | 9    |

### D10. Decisiones abiertas

| Tema           | Qué falta                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase local | Requiere Docker Desktop, que no está instalado en la máquina. Las migraciones de la fase 2 se escriben igualmente; aplicarlas exige Docker o un proyecto en la nube |
| Dominio        | Sin dominio no se pueden cerrar canonicals, `NEXT_PUBLIC_SITE_URL` ni el remitente de email                                                                         |
| Mapa de España | Se hará con SVG por comunidades. Falta localizar una fuente con licencia explícita y verificarla                                                                    |
| Paleta         | Aprobada la del §6. Falta verificar los contrastes reales de los seis estados normativos en claro y oscuro, y reportar los ratios (fase 1)                          |

### D11. Redirección de `/es` a la raíz

Con `localePrefix: 'as-needed'`, Next sirve las rutas prerenderizadas bajo `/es`
directamente, **sin pasar por el proxy** (se comprobó con
`x-nextjs-prerender: 1` y ausencia de cabecera `link` en la respuesta). El
resultado era que `/` y `/es` devolvían el mismo contenido: duplicado para los
buscadores.

Se añaden dos `redirects` permanentes en `next.config.ts`, de `/es` y
`/es/:path*` hacia la raíz. La documentación de Next confirma que los
`redirects` se evalúan en el paso 2 del enrutado y el proxy en el 3, así que no
chocan con la reescritura interna de `/` a `/es` que hace el proxy.

Verificado: `/es` responde 308 hacia `/`, `/` sirve español y `/en` inglés, sin
bucle de redirección.

---

## Fase 1

### D12. Primitivas Radix propias en lugar del preset de shadcn/ui

El CLI de shadcn instala un preset (Nova, Vega…) que trae su propia paleta de
variables y la fuente Geist. Eso sustituiría la paleta del §6 y la tipografía
Inter + Source Serif 4, que están especificadas con mucho más detalle que la
elección de librería.

Se instalan las primitivas de Radix, `class-variance-authority`, `clsx` y
`tailwind-merge` directamente, y los componentes viven en el repo bajo
`components/ui`, que es el modelo de shadcn/ui. Lo que no se adopta es su tema.

### D13. Contrastes verificados

Calculados con la fórmula de luminancia relativa de WCAG 2.1. La paleta del §6
pasa **AA entera en modo claro**. Resultados relevantes:

| Par                                    | Ratio      | Veredicto                          |
| -------------------------------------- | ---------- | ---------------------------------- |
| obligatorio sobre su fondo             | 6.05:1     | OK                                 |
| pendiente de reglamento sobre su fondo | 5.20:1     | OK                                 |
| recomendado sobre su fondo             | 5.57:1     | OK                                 |
| no aplica sobre su fondo               | 7.36:1     | OK                                 |
| sin datos sobre su fondo               | 6.02:1     | OK                                 |
| cumplido sobre su fondo                | 5.40:1     | OK                                 |
| texto-3 sobre fondo                    | 4.62:1     | OK, es el más justo de los neutros |
| **blanco sobre acento-400**            | **2.08:1** | **Falla**                          |

**Corrección aplicada**: el ámbar `#F2A33C` no admite texto blanco. El botón
secundario usa `--color-texto` sobre el ámbar, que da 8.52:1. Queda fijado en el
componente, no depende de que quien lo use se acuerde.

### D14. Modo oscuro: valores derivados y dos correcciones

El §6 daba fondo, superficie, borde y texto, y pedía recalcular los estados. Los
seis estados se han derivado usando texto claro de la misma familia de tono
sobre fondo muy oscuro teñido del mismo tono. Todos quedan entre 6.55:1 y
10.62:1. Dos hallazgos que corrigen el §6:

1. **El borde `#26333A` da 1.34:1 contra la superficie.** Sirve como separador
   decorativo, pero WCAG 1.4.11 exige 3:1 para el borde que identifica un
   control (inputs, selects). Se añade `--color-borde-fuerte: #586E79` en
   oscuro, que da 3.25:1.
2. **El anillo de foco no puede ser `marca-500` en oscuro**: da 2.61:1 y
   incumple. Se usa `marca-300` (7.76:1). Por eso el foco es un token propio,
   `--color-foco`, que cambia con el tema, y no una referencia fija a la marca.

### D15. `useSyncExternalStore` en el selector de tema

El patrón habitual de leer `localStorage` dentro de un `useEffect` y guardarlo
con `setState` lo rechaza la regla `react-hooks/set-state-in-effect` de React 19. El tema es estado externo del navegador, así que se lee con
`useSyncExternalStore`, con lectura de servidor que devuelve 'sistema' para que
la hidratación coincida.

### D16. `setRequestLocale` en cada capa que deba ser estática

Al añadir el layout público con textos traducidos, todas las rutas pasaron de
generarse estáticamente a renderizarse bajo demanda. next-intl exige llamar a
`setRequestLocale` en cada layout y página que deba prerenderizarse. Con la
llamada en el layout del grupo `(public)`, las rutas vuelven a ser estáticas,
lo cual importa para el objetivo de Lighthouse del §16.

---

## Fase 2

### D17. Validación de migraciones sin Docker

Docker Desktop está instalado pero su motor Linux no arranca: **WSL no está
instalado** en la máquina y activarlo exige elevación y reinicio. Para no
entregar SQL sin ejecutar, las migraciones se validan contra Postgres 18
compilado a WebAssembly (`@electric-sql/pglite`), simulando los esquemas `auth`
y `storage` que Supabase aporta en un proyecto real.

- `pnpm db:validar` aplica las 10 migraciones y los seeds, y comprueba
  integridad referencial, unicidad de slugs y que el índice de búsqueda
  funciona.
- `pnpm db:rls` ejecuta 17 pruebas de las políticas RLS.

No sustituye a `supabase db reset` contra un proyecto real, pero detecta
errores de sintaxis, de dependencias entre objetos y de políticas. Es una
dependencia de desarrollo; puede retirarse cuando haya base de datos real.

### D18. Geografía: INE como fuente, dataset comunitario como contraste

- Comunidades y provincias, con su correspondencia:
  `https://www.ine.es/daco/daco42/codmun/cod_ccaa_provincia.htm` (ISO-8859-15).
- Municipios: `https://www.ine.es/daco/daco42/codmun/26codmun.xlsx`, una hoja
  por provincia, leído sin librerías (un .xlsx es un zip de XML).

**El dataset comunitario `codeforspain` se descartó como origen de nombres**:
su fichero de comunidades está doblemente codificado en UTF-8 («Andalucía»
aparece como «AndalucÃ­a»). Sí se usa como contraste independiente de los
códigos de municipio.

Resultado: **19 comunidades y ciudades autónomas, 52 provincias, 8132
municipios**, con **0 diferencias** entre el INE y la fuente de contraste.

El seed no se escribe a mano: lo genera `pnpm db:geografia`, que vuelve a
descargar las fuentes, comprueba los recuentos y aborta si algo no cuadra.

### D19. Slugs de municipio

Los nombres de municipio se repiten entre provincias y el slug es único en todo
el sitio. Hubo **17 colisiones** (`sancti-spiritus`, `arroyomolinos`, `sada`…),
desambiguadas añadiendo la provincia, de forma determinista.

El INE pospone los artículos («Mata de los Olmos, La»). El nombre oficial se
conserva intacto en `nombre`, pero el slug se genera en orden natural
(`la-mata-de-los-olmos`), que es como la gente busca.

### D20. Integridad editorial en el esquema, no solo en la disciplina

Dos restricciones hacen cumplir el §0 desde la base de datos:

1. **`normas_territorio_coherente` y `requisito_reglas_territorio_coherente`**:
   una norma estatal no puede colgar de una comunidad, una ordenanza municipal
   no puede quedarse sin municipio.
2. **Trigger `t_requisito_reglas_exigir_fuente`**: una regla en cualquier estado
   distinto de `sin_datos` necesita al menos una fuente. Es diferido, para que
   regla y fuente puedan insertarse en dos pasos dentro de la misma
   transacción. Traducido: **no se puede guardar una afirmación legal sin
   norma detrás**.

También: `razas.es_ppp_estatal` admite NULL, que significa «no verificado», y
es distinto de `false` («verificado que no lo es»).

### D21. Pendiente: tipos generados

`supabase gen types` necesita una base de datos en marcha. Queda bloqueado
hasta que WSL esté instalado o se cree un proyecto en la nube. No se han
escrito tipos a mano para no tener dos fuentes de verdad.

---

## Fase 3

### D22. Lógica de tres valores en la evaluación de condiciones

El §5 exige que «no lo sé» sea siempre una respuesta válida y que **nunca**
produzca un falso negativo. Si un campo desconocido se evaluara como `false`,
le diríamos a alguien que una obligación no le aplica cuando en realidad no
sabemos si le aplica.

Por eso `evaluarCondicion` devuelve `'si' | 'no' | 'indeterminado'`:

- `all`: basta un `no` para que sea `no`; si no hay ninguno, un
  `indeterminado` contagia.
- `any`: basta un `si` para que sea `si`; si no hay ninguno, un
  `indeterminado` contagia.
- `not` conserva el `indeterminado`.
- El operador `existe` es el único que sabe responder sobre lo desconocido:
  preguntar si un dato está relleno siempre tiene respuesta.

### D23. Una regla indeterminada solo invalida el resultado si habría ganado

Descartar toda evaluación en cuanto falta un dato llenaría la pantalla de
`sin_datos` inútiles. Darla por buena sin más produciría falsos negativos.

El criterio adoptado es exacto: se elige la ganadora entre las reglas que sí se
han podido evaluar, y después se comprueba si alguna regla indeterminada
**habría ganado** a esa, con el mismo comparador. Si es así, el resultado es
`sin_datos`; si no, la indeterminada no podía cambiar nada y se conserva la
ganadora.

En ambos casos el resultado lleva `faltanDatosDelUsuario`, para que la interfaz
pueda decir que falta un dato **suyo**, no nuestro.

Corolario: no saber dónde vives tampoco permite afirmar que una ordenanza local
no te afecta. El territorio se evalúa con la misma lógica.

### D24. Un fallo que solo apareció contra Supabase real

Con Docker ya funcionando, `supabase start` aplicó las migraciones contra
Postgres de verdad y la décima falló:

```
must be owner of table buckets (SQLSTATE 42501)
```

`storage.buckets` pertenece a `supabase_storage_admin` y el rol que aplica las
migraciones no es su dueño, así que no puede ponerle un `COMMENT`. En el
Postgres compilado a WASM la migración pasaba porque allí se ejecuta como
superusuario.

Es la confirmación de que la validación en WASM (D17) detecta mucho pero **no
sustituye** a una ejecución real. Ambas se mantienen: la de WASM es rápida y no
necesita Docker; la real es la que manda.

### D25. Tipos generados

`pnpm db:tipos` genera `apps/web/src/types/supabase.ts` desde el esquema real
(1550 líneas, 25 tablas y todos los enums). El fichero no se edita a mano ni se
formatea con Prettier: cualquier cambio se hace en una migración y se
regenera. `types/base-de-datos.ts` es la fachada estable, con los ayudantes
`Fila`, `Insercion` y `Actualizacion`.

Con esto queda cerrado lo que faltaba de la fase 2.

---

## Fase 4

### D26. El `matcher` del proxy tiene que ser un array

Al montar las rutas del asistente, **todas las rutas menos `/` daban 404**.
Causa: el `matcher` estaba escrito como cadena suelta.

```ts
// Mal: Next lo interpreta como ruta literal
matcher: '/((?!api|_next|_vercel|.*\..*).*)';

// Bien: en array sí se trata como expresión regular
matcher: ['/((?!api|_next|_vercel|.*\..*).*)'];
```

Había un segundo fallo encadenado: en un literal de cadena, `'\.'` se colapsa a
`'.'`, así que el patrón excluía cualquier ruta de dos o más caracteres. Hace
falta `'\.'`.

Esto explica también por qué en la fase 0 `/es` parecía saltarse el proxy. Aquel
diagnóstico era incorrecto: no era el prerenderizado, era el matcher.

### D27. El estado del asistente vive en la URL, no en React

`?paso=3&especie=perro&municipio=malaga`. Así el enlace se puede compartir, el
botón de atrás del navegador funciona y el paso 4 lo renderiza el **servidor**,
que es quien consulta la base de datos y ejecuta el motor.

El esquema de zod es deliberadamente tolerante (`.catch(undefined)`): cualquiera
puede escribir lo que quiera en la barra de direcciones y eso debe ignorarse, no
romper la página.

Los pasos 1 a 3 son cliente (interacción); el 4 es servidor. Es la división que
pide el §0: Server Components salvo necesidad real.

### D28. El resultado vacío es un resultado

Sin contenido legal cargado, el paso 4 no muestra una pantalla rota ni inventa
obligaciones: dice que el motor funciona, que no hay nada verificado todavía y
que no vamos a inventárnoslo. Es el comportamiento correcto, no un
provisional.

### D29. Lo que del §5 NO está hecho

Se dice explícitamente para que no se dé por terminado:

| Pendiente                                | Por qué                                                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/consulta/resultado/[token]`            | Requiere guardar la consulta en una tabla y decidir una política de retención (RGPD). Es una decisión de producto, no la tomo yo. Hoy la propia URL ya es compartible y no lleva datos personales |
| «Usar mi ubicación»                      | Geolocalización del navegador y municipio más cercano. Necesita coordenadas por municipio, que el fichero del INE no trae                                                                         |
| «10 municipios más consultados»          | Necesita datos de uso reales (`consultas_anonimas`). Poner una lista fija sería inventarse el dato                                                                                                |
| Aviso inmediato de raza PPP en el paso 3 | Depende del catálogo de razas, que no se carga hasta aprobar la ficha de verificación                                                                                                             |

### D30. La ordenación de la búsqueda de municipios es mejorable

`buscar_municipios` ordena por prefijo, después por similitud de trigramas y
después por longitud del nombre. Funciona bien («sevila» encuentra Sevilla,
«malaga» encuentra Málaga), pero sin datos de población no puede priorizar
capitales: buscando «san sebas» salen antes municipios pequeños que
Donostia/San Sebastián.

Se arregla sembrando la población por municipio desde el INE. Queda anotado.

---

## Fase 4

### D26. Dos fallos que solo aparecieron probando de punta a punta

Los tests unitarios del motor pasaban y el build estaba en verde, pero al
consultar la aplicación con datos reales aparecieron dos cosas:

**1. «Sin datos» donde en realidad sabíamos la respuesta.** A un perro le salía
«no lo sabemos» sobre la obligación de microchip de los gatos. El motor
devolvía `sin_datos` siempre que ninguna regla resultaba aplicable, sin
distinguir por qué.

Ahora se distingue: si alguna regla estaba en juego (vigente y del territorio
correcto), se pudo evaluar entera y dijo que no, entonces **sí lo sabemos** y
la respuesta es `no_aplica`. Solo es `sin_datos` cuando no hay reglas, cuando
las que hay se descartaron por territorio o vigencia, o cuando queda alguna
duda por un dato que el usuario desconoce.

Tres tests del motor esperaban `sin_datos` en casos donde `no_aplica` es la
respuesta correcta. Se corrigieron las expectativas y se añadieron cuatro tests
que fijan la distinción.

**2. Un gatito de dos meses veía «no aplica»** en la obligación de microchip y
esterilización. La regla estaba condicionada a `edad_meses >= 6`, pero el
artículo 26.i obliga respecto de **todos** los gatos: los seis meses son el
plazo, no el supuesto de hecho. Condicionarlo a la edad hacía que la obligación
solo apareciera cuando ya se había incumplido, que es justo al revés de lo útil.

La condición pasa a ser solo la especie y los seis meses viajan como parámetro
y como `plazo_texto`. El texto literal y el artículo no se tocan.

### D27. El fundamento legal faltaba en el resultado

Las tarjetas mostraban estado, ámbito, parámetros y traza, pero **no la norma**.
Eso incumple el §16 de plano. Se añade la carga de `requisito_fuentes` para las
reglas ganadoras y su render con `CitaLegal`: cita literal en serif, norma,
artículo, enlace al BOE y fecha de verificación.

Si una regla que afirma algo no trajera fuente, la tarjeta muestra un aviso
diciendo que no se dé por buena. Es una red de seguridad: el trigger de base de
datos ya lo impide, pero la interfaz no debe confiar en ello.

### D28. La raza se elige del catálogo, no se escribe libre

El campo de raza era texto libre, así que la regla de PPP nunca podía
dispararse. Ahora es un combobox contra el catálogo y envía el slug.

`es_ppp` se deriva en el servidor: lista estatal del anexo I, y si hay fila en
`razas_ppp_autonomicas` para esa comunidad, esa manda. **Sin raza elegida,
`es_ppp` es `null`**, no `false`: a un perro sin raza indicada le sale «sin
datos verificados» en la licencia PPP, nunca «no aplica».

Verificado en la aplicación real:

| Caso                    | Licencia PPP                     |
| ----------------------- | -------------------------------- |
| Rottweiler, Málaga      | obligatorio, cobertura 120.000 € |
| Perro sin raza indicada | sin datos verificados            |
| Gato                    | no aplica                        |

### D29. Combobox genérico

`ComboboxMunicipio` se generalizó a `ComboboxBusqueda`, que sirve para
municipios y razas y mantiene el patrón ARIA completo (`role="combobox"`,
`aria-expanded`, `aria-activedescendant`, navegación con flechas). Los
resultados se guardan junto al término que los produjo, de modo que nunca se
muestran sugerencias que ya no corresponden a lo tecleado, y sin escribir
estado dentro de un efecto.

### D30. Enlace compartible: token en base de datos, 90 días

`/consulta/resultado/[token]` guarda el perfil consultado en
`consultas_compartidas` y caduca a los 90 días.

- **El token lo genera el servidor** con `randomBytes(24)` en base64url: 32
  caracteres no adivinables ni enumerables.
- **La caducidad la hace cumplir RLS**, no el código de la aplicación: la
  política de lectura filtra por `expira_en > now()`, así que un enlace vencido
  sencillamente no existe para quien lo pide. La función de purga lo borra
  después de verdad.
- Una segunda política impide crear enlaces con caducidad mayor de 90 días,
  para que nadie pueda saltarse el límite escribiendo directamente contra la API.
- **Lo que se guarda es una lista explícita** (`estadoACompartible`), no un
  descarte de campos: si mañana se añade un campo al formulario, no acaba
  guardado por descuido. Quedan fuera el paso del asistente y el nombre del
  animal, que es lo único del formulario que podría identificar indirectamente
  a alguien.

Dos pruebas de RLS nuevas cubren esto: el anónimo ve el enlace vivo y no el
caducado, y no puede crear uno con caducidad de diez años.

**Un fallo por el camino**: `esquemaConsulta` valida las cadenas que llegan por
la URL y las convierte a números, así que no hace round-trip sobre su propia
salida. El enlace válido daba «no disponible» porque el perfil guardado no
pasaba la validación al releerlo. Se separó en dos esquemas:
`esquemaConsulta` para la URL y `esquemaConsultaGuardada` para lo almacenado.

### D31. Checklist imprimible por CSS, sin PDF en servidor

`@media print` fuerza el tema claro (imprimir en oscuro gasta tinta y se lee
peor), oculta cabecera, pie y botones, evita que una tarjeta se parta entre dos
páginas, **imprime abiertos los desplegables de la traza** (en papel no hay
clic) y añade la URL detrás de cada enlace, para que la fuente oficial se pueda
comprobar desde el papel.

Sin dependencia de PDF, como pide el §13.

---

## Decisiones sobre los tres hallazgos de la investigación autonómica

Investigados a fondo y resueltos. Los tres contradicen el §1 del brief.

### D32. La Rioja: no se carga ninguna regla autonómica

**Comprobado**, vía endpoint de metadatos del BOE:

- Ley 5/1995 de Protección de los Animales → derogada el **30/11/2018**.
- Ley 6/2018 → derogada el **08/08/2023** por la Ley 10/2023, de 7 de agosto,
  cuyo artículo único dice: «Queda derogada la Ley 6/2018, de 26 de noviembre,
  de protección de los animales en la Comunidad Autónoma de La Rioja».
  **No la sustituye.**
- Derogar la norma derogatoria no resucita la de 1995.

**Decisión: no se crea ninguna regla autonómica para La Rioja**, y _no_ se
marca la comunidad como `sin_datos` en bloque.

El motivo es importante: `sin_datos` significa «no lo hemos verificado». Aquí
sí lo hemos verificado, y el resultado es que no hay ley autonómica. Al no
existir regla autonómica, ganan las estatales, que es exactamente lo que le
ocurre hoy a alguien de Logroño. Los requisitos que dependen de norma
territorial (censo municipal) siguen saliendo `sin_datos` por la regla 5 del
motor, que es correcto.

En la página de La Rioja debe decirse expresamente que la comunidad derogó su
ley y que solo rige el marco estatal. Es información útil, no una laguna.

**Ojo**: el campo de derogación del _índice_ del BOE no es fiable (daba la Ley
6/2018 como vigente). Solo vale el endpoint `/metadatos`, que es el que usa el
extractor.

### D33. Madrid: el seguro es `obligatorio_pendiente_reglamento`, no `obligatorio`

> **Superada por D54.** La Ley 7/2024 suprimió el seguro de la ley madrileña;
> lo que sigue describe el texto anterior a esa reforma.

El §1 afirmaba que Madrid ya exigía seguro de responsabilidad civil antes que
el Estado. El texto vigente de la Ley 4/2016, art. 6.2.a) dice:

> a) Contratar un seguro de responsabilidad civil **en aquellos casos que se
> determine reglamentariamente**.

Datos que cierran la cuestión:

- El consolidado del BOE está actualizado a **19/12/2025**.
- El artículo 6 **fue reformado** por la Ley 7/2024, de 26 de diciembre
  (`BOE-A-2025-5522`), en vigor desde el 28/12/2024, y **la remisión al
  reglamento se mantuvo**.
- No he localizado reglamento publicado que determine esos casos. Lo último
  encontrado es una nota de la propia Comunidad de octubre de 2018 diciendo que
  el reglamento estaba «en fase final de tramitación».

**Decisión: `obligatorio_pendiente_reglamento`**, el mismo estado que el
estatal. La ley enuncia la obligación pero no es exigible mientras no se
determinen los casos.

No se marca `obligatorio` porque diríamos a un madrileño que tiene que
contratar un seguro que hoy no se le puede exigir. Y no se marca `sin_datos`
porque sí sabemos lo que dice la ley. El estado intermedio existe justo para
esto.

Nota: esto **no afecta a los perros potencialmente peligrosos**, cuyo seguro de
120.000 € sí es exigible hoy por el RD 287/2002, que es norma estatal y no
depende de Madrid.

### D34. Ceuta y Melilla: su normativa es de ámbito municipal, no autonómico

No aparecen en el consolidado del BOE (0 normas), y no es un fallo de búsqueda:
son ciudades autónomas **sin potestad legislativa**, así que no dictan leyes.
Regulan mediante reglamentos y ordenanzas de la propia ciudad.

**Decisión: no se crean reglas de ámbito autonómico para Ceuta ni Melilla.** Lo
que regulen entra como **ámbito municipal**, que en el modelo de datos es el
que corresponde a una ordenanza. En la geografía del INE ambas existen como
comunidad, provincia y municipio, así que el motor las resuelve sin cambios.

Consecuencia práctica: entran con la carga de ordenanzas municipales, no con la
de leyes autonómicas.

---

## Fase 2 (contenido autonómico)

### D35. La selección del artículo es humana; la cita, automática

Se probaron dos heurísticas para localizar automáticamente el precepto que crea
cada obligación. Las dos fallaban entre el 20% y el 30%:

- escogían **artículos de infracciones**, que describen el incumplimiento pero
  no crean el deber (Galicia art. 39, Cantabria art. 47);
- escogían deberes de **terceros** en lugar del titular: del veterinario
  (Murcia art. 14, País Vasco art. 8) o del vendedor (C. Valenciana art. 19);
- escogían **cláusulas de excepción** en vez del precepto general (Madrid
  art. 7 en lugar del 11, Cataluña art. 18 en lugar del 15).

Ordenar por «frase más corta» favorecía la mención incidental; por «más larga»,
la excepción. Ninguna de las dos sirve.

**Decisión**: la elección de norma, artículo y estado la hace una persona y está
escrita en `SELECCION`, dentro de `generar-autonomicas.mjs`. Lo que **no** se
escribe a mano es la cita: el script la extrae del XML consolidado del BOE
mediante un localizador, así que es literal por construcción y no depende de
que nadie la transcriba bien. Si un localizador deja de encontrar su frase
—porque la norma cambió—, **el script falla en vez de emitir una cita vacía**.

### D36. Dos matices sobre la remisión reglamentaria

La regla aprobada dice que una obligación que remite a reglamento es
`obligatorio_pendiente_reglamento`. Aplicarla literalmente habría sido erróneo
en dos casos, porque la remisión no alcanzaba al deber principal:

- **País Vasco**, art. 4.m): «Contratar un seguro de responsabilidad civil para
  la tenencia de perros, **y** para aquellas especies que se determine
  reglamentariamente». Para perros el deber es directo → `obligatorio`.
- **Asturias**, art. 12: los perros y gatos «deberán ser identificados
  individualmente mediante microchip **en las condiciones que**
  reglamentariamente se determinen». La remisión regula el cómo, no el si, y el
  propio artículo añade «en todo caso» → `obligatorio`.

Mismo criterio en Andalucía (art. 17) y Comunitat Valenciana (art. 10), donde la
remisión solo alcanza a especies añadidas.

### D37. El BOE separa «Artículo» del número con espacio duro

Comparar `'Artículo 14'` contra el título del XML fallaba pese a imprimirse
igual y medir lo mismo: el BOE usa **U+00A0** y el script un espacio normal. Se
normaliza al decodificar. Es el tipo de fallo que no se ve leyendo el código.

### D38. Cobertura real de esta tanda

> **Superada por D58.** Las cinco comunidades pendientes tienen ya sus reglas.

**14 reglas en 11 comunidades**, sobre identificación, censo municipal y seguro.

Cinco comunidades quedan **sin regla autonómica**: Illes Balears, Canarias,
Cantabria, Castilla y León y Extremadura. Sus leyes son de 1991-1997 y emplean
una redacción que no encaja con los localizadores. **No se ha inventado nada
para rellenarlas**: salen como `sin_datos`, que es lo honesto. El articulado
completo está en la ficha de verificación para una tanda posterior.

`pnpm db:contenido` comprueba que lo cargado sigue diciendo lo que decidimos:
que toda afirmación tenga fuente, que ninguna cita esté truncada y que D32, D33
y D34 se respeten.

---

## Rediseño y V1 informativa

### D39. La V1 es solo informativa: sin cuentas, sin perfil, sin panel

Decisión del propietario: la primera versión es una web informativa con
buscador y consulta. Todo lo relativo a usuarios (autenticación, área privada,
animales guardados, avisos por email, panel de administración, enlace
compartible con token) pasa a la V2.

- Las migraciones de usuarios y operación se conservan en
  `supabase/v2/migrations/` y no se aplican.
- El enlace compartible es la propia URL de la consulta. No viaja el nombre del
  animal (lista explícita en `queryCompartible`).
- `/colabora` no guarda nada: abre el programa de correo con el mensaje
  preparado.

### D40. Datos dentro de la web, sin base de datos en producción

Postgres sigue siendo la fuente de verdad para preparar y validar el contenido
(migraciones, seeds, RLS, tests de contenido), pero la web lee JSON exportados
en cada cambio (`pnpm datos`). `pnpm datos:comprobar` falla si los JSON no se
corresponden con los seeds, y forma parte de `pnpm verificar`.

Consecuencias: despliegue sin base de datos, cero latencia de consulta, y el
diff de cualquier cambio legal se revisa línea a línea. Las 8.132 fichas de
municipio se generan bajo demanda la primera vez que se visitan (ISR); las
capitales y las diez ciudades más pobladas se generan al compilar.

### D41. Paleta «Bosque y miel» y tipografía

Verde bosque (naturaleza, veterinaria) y miel (calidez) sobre crema, con el
lenguaje visual de TraceIT. Contrastes verificados:

- Botón principal miel `#f5b84f` con texto `#06140f`: 10,63:1. Con texto blanco
  no llegaba a AA, por eso el texto es oscuro.
- Botón secundario esmeralda `#177f61` con blanco: 4,95:1 (el `#1f9d78` daba
  3,41:1 y se descartó).
- Borde de controles `#968a76` sobre blanco: 3,39:1 (WCAG 1.4.11).

Tipografías: Sora (titulares), Geist (texto), Geist Mono (etiquetas) y Source
Serif 4 para el texto legal literal. Se sirven desde el propio dominio.

### D42. Las reglas autonómicas se limitan a las especies que nombra su artículo

Las reglas de identificación y censo se habían cargado con condición vacía, así
que se aplicaban a cualquier especie: a un pez en Madrid le salía obligatorio un
microchip que el artículo 11 de la Ley 4/2016 solo exige a perros, gatos,
hurones, conejos y équidos.

Cada entrada de la selección declara ahora `especies`, tomadas literalmente de
su artículo. Dos casos merecen nota:

- **Galicia, art. 12.1**: la identificación es obligatoria **solo para perros**
  (y animales potencialmente peligrosos); para el resto la ley la declara
  voluntaria. La cita anterior («El animal deberá ser identificado…») omitía
  justo la frase que dice a qué animal se refiere. Se cita ahora la frase
  anterior y la del plazo, y la regla se limita a perros.
- **Castilla-La Mancha, art. 4.1.a** (censo): el deber alcanza a los censos «que
  en cada caso correspondan». Se aplica a las especies de identificación
  obligatoria en la misma ley (art. 14): perros, gatos y hurones.

`pnpm db:contenido` comprueba que ninguna regla autonómica quede sin especies.
**Pendiente de revisión por el propietario**, por ser un cambio de contenido
legal.

### D43. Leyes autonómicas sin reglas: se cargan igualmente

Las cinco comunidades con ley propia aún sin curar (Illes Balears, Canarias,
Cantabria, Castilla y León y Extremadura) y la ley derogada de La Rioja se
cargan como normas **sin reglas**, con metadatos del BOE (número, fecha, estado
de derogación). Así la ficha de cada comunidad dice qué ley tiene, o que no
tiene ninguna, en lugar de callar.

La Rioja: el análisis del BOE confirma que la Ley 6/2018 fue derogada por la
Ley 10/2023, de 7 de agosto (`BOE-A-2023-18413`).

### D44. Artículos de referencia estatales

Las guías (multas, perros potencialmente peligrosos, qué hacer si…) citan
artículos que no fundamentan ninguna regla del motor: sanciones de la Ley
7/2023 (arts. 72 a 76), infracciones y multas de la Ley 50/1999 (art. 13),
medidas de seguridad del RD 287/2002 (arts. 3, 8 y 9), pérdida y muerte del
animal (arts. 24 y 26). `supabase/seed/generar-referencia-estatal.mjs` los
extrae literalmente del consolidado del BOE a partir de una selección humana, y
falla si un párrafo deja de encontrarse.

Las multas se muestran como tramos literales de la ley. Nunca un importe
estimado.

### D45. Anclas de artículo del BOE

Las anclas de la página del BOE no son `#a30`, sino el id del bloque del
consolidado (`#a3-2` para el art. 30 de la Ley 7/2023). Se corrigieron las del
seed estatal y los generadores las calculan ahora a partir del propio XML.

### D46. Consulta: pregunta explícita de perro potencialmente peligroso

El catálogo de razas solo contiene las del anexo I. Para cualquier otra raza,
el asistente pregunta si el perro está considerado potencialmente peligroso
(sí / no / no lo sé), porque también lo son los cruces, los que reúnen las
características del anexo II y los declarados por su conducta. Sin respuesta,
el motor recibe «desconocido» y la licencia sale `sin_datos`, nunca `no_aplica`.

## Auditoría y paso a sitio estático

### D47. Paleta clara «Hoja» y tema claro por defecto

Sustituye a los colores de D41 (la tipografía se mantiene, salvo Geist Mono, que
ya no se usa). Fondo blanco y una sola familia de verdes para marca, enlaces y
acentos; el cálido queda para detalles puntuales. El tema oscuro sigue
disponible desde el pie, pero solo se aplica si la persona lo elige («oscuro» o
«sistema»).

Contrastes medidos sobre los tokens de `global.css` (WCAG 2.2 AA):

| Par                                      | Claro | Oscuro |
| ---------------------------------------- | ----- | ------ |
| Texto principal sobre fondo              | 16,14 | 17,08  |
| Texto terciario sobre fondo              | 5,53  | 6,95   |
| Texto terciario sobre menta (marca-50)   | 5,17  | 5,10   |
| Enlace (marca-700) sobre fondo           | 6,54  | 12,14  |
| Botón: texto sobre marca-600             | 4,96  | 9,07   |
| Borde de control sobre fondo (1.4.11)    | 3,28  | 4,50   |
| Anillo de foco sobre fondo               | 4,96  | 9,07   |
| Estados (texto sobre su fondo), el menor | 5,20  | 6,64   |

### D48. De Next.js a Astro: sitio 100 % estático con islas

Sustituye a D2 y D3, y a la generación bajo demanda (ISR) de D40.

**Por qué**: sin cuentas en la V1 (D39) y con los datos dentro de la web (D40),
todo el contenido es público y solo cambia cuando cambian los seeds. Next
obligaba a mantener un servidor Node para las acciones de búsqueda, la consulta
dinámica, el ISR de las fichas y la cookie de idioma, y enviaba más de 100 KB de
JavaScript por página más la carga RSC duplicada en el HTML.

**Cómo queda**:

- Astro 7.3.5 con salida estática: las 8.132 fichas de municipio de los dos
  idiomas se generan al compilar (16.497 páginas en unos 3,5 minutos). Las URL
  son las mismas que antes (`build.format: 'file'`, sin barra final).
- Lo interactivo son islas Preact (unos 10 KB comprimidos de runtime) que se
  hidratan al quedar el navegador libre o al entrar en pantalla. La consulta
  se calcula en el navegador con el mismo `@leyanimal/reglas` (23 KB
  comprimidos). El índice de municipios (`/datos/municipios.json`, 111 KB
  comprimidos) solo se descarga al enfocar el buscador o el campo de municipio.
- Internacionalización propia: los mismos catálogos JSON, con un formateador
  del subconjunto ICU que usamos (variables, `number` y `plural`) sobre `Intl`.
  La compilación falla si falta una clave o si dos ficheros declaran el mismo
  espacio. Cada isla recibe solo los espacios que usa.
- Sin cookies: el idioma va en la URL y el tema, solo si se elige, en
  `localStorage`. Las páginas de privacidad y cookies lo dicen así.
- Los números llevan siempre separador de miles («8.132»), también los de
  cuatro cifras, para que no convivan dos formatos en la misma página.

**Dependencias**: salen `next`, `next-intl`, `react`, `react-dom`,
`@radix-ui/react-dialog` (ahora `<dialog>` nativo), `clsx`, `tailwind-merge` y
`zod` (el estado de la URL se valida contra listas cerradas). Entran `astro`,
`@astrojs/preact`, `preact`, `lucide-preact`, `@tailwindcss/vite`, `sharp`
(optimización de imágenes; ya llegaba antes a través de `next/image`),
`@astrojs/check`, `eslint-plugin-astro` y `prettier-plugin-astro`. Las
imágenes para compartir se generan con `pnpm og` usando el Chrome instalado,
sin dependencias.

**Coste conocido**: la carpeta publicada ocupa unos 1,1 GB en 16.600 ficheros
(67 KB por ficha, 13 KB con gzip). Casi un tercio son iconos SVG en línea; un
sprite de iconos lo reduciría si el alojamiento lo pidiera.

**V2**: cuando lleguen las cuentas, Astro admite rutas con servidor junto a las
estáticas mediante un adaptador, o puede montarse una aplicación aparte. El
motor de reglas y los datos no cambian.

### D49. Sin Supabase ni Postgres: el contenido legal vive en JSON

Sustituye a D7, D17, D20, D21 y D25, y a la parte de D40 que hacía de Postgres
la fuente de verdad.

**Por qué**: en la V1 no hay usuarios, y Supabase solo servía como Postgres
local (PGlite) para cargar los seeds SQL, validarlos y exportarlos a JSON. Para
un sitio estático era una capa de más: SQL que se convertía en JSON que es lo
único que usa la web.

**Qué se ha quitado**: la carpeta `supabase/` completa (configuración del CLI,
esquema y políticas RLS de la V1, migraciones y pruebas de la V2, seeds SQL,
exportador y validadores) y las dependencias `@electric-sql/pglite` y
`supabase`.

**Cómo queda**:

- Los JSON de `apps/web/src/datos/` son la fuente de verdad, repartidos por
  origen: lo escrito a mano (`estatal.json`, `catalogo.json`, `cambios.json`) y
  lo extraído del BOE y el INE por los generadores (`autonomico.json`,
  `referencia-estatal.json`, `geografia.json`, `municipios.json`). La web los
  une con un orden estable (`src/lib/datos/orden.ts`, el mismo que usan los
  scripts).
- Los generadores (`apps/web/scripts/contenido/`) mantienen la selección
  humana y la extracción literal del BOE, y escriben JSON en lugar de SQL.
- Las restricciones que ponía el esquema (claves únicas, referencias que
  existen, valores permitidos, territorio coherente con el ámbito y el
  disparador que impedía una regla sin fuente) y las pruebas de contenido (D32,
  D33, D34, D42 y Galicia) pasan a `pnpm datos:comprobar`. Se añade una
  comprobación que antes no había: cada cita tiene que aparecer literalmente en
  el texto de su artículo.

**Verificación de la conversión**: el contenido que resulta es idéntico al que
exportaba Postgres: 20 normas, 60 artículos, 6 requisitos, 18 reglas y 21
fuentes con los mismos campos y en el mismo orden; geografía, municipios,
catálogo y cambios, byte a byte. Los identificadores de las reglas autonómicas
(md5 de la norma y el requisito) se calculan igual que antes.

**V2**: las cuentas necesitarán un backend; se elegirá cuando se diseñe esa
fase. Las migraciones de la V2 que había no se conservan.

## Segunda auditoría y guías por situación (septiembre de 2026)

### D50. Un solo proyecto: fuera el monorepo y la V2

Sustituye a la parte de D48 y de la auditoría anterior que mantenía el motor
como paquete aparte «para la V2».

**Por qué**: decisión del propietario (28/09/2026): la web va a ser solo una
página informativa, sin login ni base de datos. El monorepo (`apps/web` y
`packages/reglas` con workspaces de pnpm) solo se justificaba para reutilizar
el motor en una V2 con servidor, que ya no va a existir.

**Qué cambia**:

- La web vive en la raíz del repositorio y el motor en `src/lib/reglas/`, con
  sus tests al lado. Se movió con `git mv`: el historial se conserva.
- Un solo `package.json`; los scripts ya no usan `--filter`. `pnpm-workspace.yaml`
  solo guarda los ajustes de pnpm (`allowBuilds`).
- `astro check` y ESLint cubren también el motor (antes no tenía lint). Sale
  `ssr.noExternal` de la configuración de Astro, que solo existía para
  consumir el paquete como TypeScript.
- IDEAS.md pasa la V2 a «Decidido dejar fuera».

### D51. Guías por situación

Qué necesita tu animal según lo que vayas a hacer: comprar o adoptar,
mudarte, viajar por España, viajar al extranjero y perro de asistencia. La de
perros potencialmente peligrosos ya existía y el índice enlaza a ella en lugar
de repetirla. El caso «Te mudas» sale de «Qué hacer si…», que queda para
incidencias (pérdida, mordedura, maltrato, muerte).

**Estructura**: `src/lib/contenido/situaciones.ts` declara los puntos de cada
guía; el texto está en los catálogos. Cada punto lleva uno de los estados del
sitio (obligatorio, pendiente de reglamento, recomendado) o «depende del
lugar», para lo que decide la comunidad, el ayuntamiento, la compañía de
transporte o el país de destino.

**Criterios**:

- Mismo criterio que D36: si la remisión a reglamento regula el cómo y no el
  si, el punto es obligatorio. El contrato escrito de compraventa (art. 55.2)
  es exigible aunque sus cláusulas mínimas estén por fijar; el curso y el
  seguro de la Ley 7/2023 (art. 30) siguen pendientes, como en el motor.
- Cuando la obligación recae en otro (el vendedor, la protectora, el
  establecimiento), el punto dice lo que la persona tiene derecho a exigir o
  debe comprobar, con el artículo que obliga al otro.
- Ningún punto obligatorio sin artículo: `pnpm datos:comprobar` lo rechaza, y
  también un artículo citado que no exista. `FuentePlegable` rompe la
  compilación si una página cita un artículo inexistente (antes lo omitía en
  silencio).

**Normas nuevas**: el Real Decreto 409/2025, de 27 de mayo, de perros de
asistencia (BOE-A-2025-10490, en vigor desde el 17/06/2025), que la web no
tenía pese a ser estatal y posterior a la Ley 7/2023, y el artículo 18.1 del
Reglamento General de Circulación (colocación de los animales en el coche).
Las 50 citas nuevas salen literales del BOE con `pnpm datos:referencia`; las
38 que ya había no cambiaron ni una línea, lo que confirma que siguen al día.
Se completó el art. 3.3 del RD 287/2002, al que le faltaba su última frase
(comunicar en quince días cualquier cambio en los datos de la licencia).

**Viajar al extranjero**: los detalles vienen del Reglamento (UE) 576/2013, que
no se cita literalmente: el modelo solo tiene ámbitos españoles y el extractor
solo lee el BOE. El punto obligatorio se apoya en el art. 61.3 de la Ley
7/2023, que obliga a cumplir la normativa europea «y, en particular, la
vacunación antirrábica». Los detalles (microchip antes de la vacuna, doce
semanas, 21 días de espera, pasaporte europeo, tenia para cinco destinos,
máximo cinco animales) se explican enlazando a Tu Europa y al Ministerio de
Agricultura; se comprobaron el 28/09/2026 en la página de Tu Europa.

**Filtro por animal**: CSS (`:has()`), sin JavaScript. Un script mínimo lo
recuerda en la URL (`?animal=gato`) y anuncia a los lectores de pantalla
cuántos puntos quedan. El resultado de la consulta enlaza a las guías ya
filtradas por la especie consultada, y pone primero la de perros de asistencia
cuando el uso declarado es ese.

**Menú**: «Situaciones» entra en segundo lugar y «Cambios» sale del menú
superior (sigue en el pie y en la portada): con seis enlaces no caben junto al
buscador a 1024 px.

### D52. Pendiente de decisión: la identificación estatal en el motor

> **Resuelta en D55.** El motor tiene ya la regla estatal del art. 51.2.

El art. 51.2 de la Ley 7/2023 obliga a identificar con microchip a perros,
gatos y hurones en toda España. El motor solo tiene la identificación por
reglas autonómicas (y la de gatos por el art. 26.i), así que en las
comunidades sin regla propia (Illes Balears, Canarias, Cantabria, Castilla y
León, Extremadura, La Rioja, Ceuta y Melilla) la consulta de un perro da
«sin datos» en identificación, aunque la ley estatal la exige. Las guías por
situación ya citan el art. 51.2.

Añadir una regla estatal cambiaría los resultados de la consulta en todo el
país: es un cambio de contenido legal y, como D42, **queda pendiente de
revisión por el propietario**. No se ha tocado el motor.

### D53. Ajustes visuales: portada más corta, sin rótulos, iconos a color

Decisiones del propietario (29/09/2026) y lo que se hizo con cada una.

- **Cabecera**: sale el buscador global (su isla, su índice JSON y sus
  textos). Entra un botón de tema claro/oscuro, sin la opción «sistema», que
  obligaba a duplicar todos los colores del tema oscuro en el CSS. Orden:
  idioma, tema y «Consultar». El selector de tema del pie desaparece.
- **Cursor**: mano en todo lo que se pulsa. Tailwind 4 deja los botones con el
  cursor normal; una regla de la capa base lo corrige para botones, resúmenes
  plegables y opciones.
- **Rótulos pequeños sobre los títulos («eyebrows»)**: fuera todos. En las
  páginas interiores repetían lo que ya dicen las migas; en la portada eran
  relleno de plantilla. El de cada norma («Estatal · Real decreto») pasa a
  chips junto a su estado.
- **Portada**: de diez secciones a siete. Salen «Cómo funciona» (los tres pasos
  de cualquier plantilla) y «Estado de la ley», cuyo contenido se une a «Lo que
  se suele leer»: cada fila lleva ahora el estado real, que sale de la regla
  estatal, y su cita plegable. «Por qué fiarte» y «Últimas verificaciones» se
  unen en una sección, sin la foto de archivo. La rejilla de guías deja de
  repetir PPP y seguro. Se añade un quinto mito: el microchip de los gatos
  (art. 26.i).
- **Desplegable de municipios del hero**: quedaba debajo del texto porque cada
  bloque animado del hero es una capa propia; el del selector va por encima.
- **Contacto**: correo definitivo (leyanimalcontacto@gmail.com), con botones
  para abrirlo y copiarlo y dos tarjetas que llevan a Colabora o a la
  consulta. Fuera los avisos de buzón provisional.
- **Páginas legales**: tarjeta alineada con el título (antes estaba centrada)
  e índice lateral. Contenido revisado: la privacidad dice que el buzón está en
  Gmail, para qué usamos lo que nos escriben y durante cuánto tiempo; cookies
  ya no habla de un tema «del sistema»; accesibilidad aclara que la
  declaración es voluntaria (el RD 1112/2018 es para el sector público).
- **Sin créditos de imágenes en la web**: fuera la sección de fotografías de
  «Sobre» y la mención a Unsplash del aviso legal (su licencia no exige
  atribución; la autoría queda en `src/assets/fotos/CREDITOS.md`). Se
  mantiene «Datos: BOE e INE» en el pie: las condiciones de reutilización de
  sus datos piden citar la fuente.
- **Iconos**: los de contenido pasan de Lucide (línea dentro de un cuadrado
  verde, el patrón de cualquier web generada) a Fluent Emoji Flat, a color,
  con licencia MIT. Un generador descarga solo los elegidos y cada isla
  importa los suyos. Los de interfaz siguen de línea.
- **Logotipo**: el escudo plano pasa a tener volumen (degradado, cara derecha
  iluminada, brillo, filete interior y huella con sombra), sin cambiar la
  idea. Un solo dibujo para la web, el favicon y las imágenes para compartir.

## Revisión legal completa (29 de septiembre de 2026)

Se volvieron a descargar del BOE todas las leyes (texto vigente, metadatos y
análisis de reformas), se releyó el articulado de las 17 leyes autonómicas y
se buscaron en los boletines autonómicos los decretos que el consolidado del
BOE no recoge. Cada cambio de contenido tiene su entrada en `cambios.json`.

### D54. Madrid ya no exige seguro: la Ley 7/2024 lo suprimió

El generador buscaba la cita en todas las versiones del artículo, no solo en
la vigente, y seguía encontrando la frase del seguro de la redacción
anterior. Con la Ley 7/2024, de 26 de diciembre (`BOE-A-2025-5522`, en vigor
desde el 28/12/2024), el art. 6 de la Ley 4/2016 se reescribió entero y **ya
no obliga a contratar un seguro**; el art. 11 remite la identificación a la
Ley 7/2023 y el art. 21, las sanciones.

**Decisión**: Madrid no tiene reglas autonómicas propias; rigen las estatales
(seguro pendiente de reglamento, identificación del art. 51.2). La ficha de
Madrid lo dice con un estado propio, `remite`, distinto de «sin ley».

**Corrección del método**: el generador y el extractor leen ahora solo la
última versión de cada artículo. Era un fallo silencioso: la comprobación de
que la cita existe pasaba, porque la frase seguía en el XML.

### D55. Identificación estatal y ámbito de la Ley 7/2023

Resuelve D52. Reglas estatales nuevas:

- **Art. 51.2**: perros, gatos, hurones y aves (anilla), `obligatorio`.
- **Art. 51.1**: el resto de especies se identificará con el sistema que fije
  un reglamento por especie, que no existe → `obligatorio_pendiente_reglamento`.
- **Art. 1.3.e**: los perros de caza, pastoreo y trabajo quedan fuera de la
  ley. El seguro, el curso y la identificación estatales no se les aplican; su
  identificación sale `sin_datos` (no `no_aplica`) donde no hay regla
  autonómica, porque la exige la normativa de caza, ganadería o sanidad de
  cada comunidad. Un perro sin uso declarado se evalúa como de compañía: la
  pregunta no tiene «no lo sé».

El fundamento legal de una obligación incluye ahora también las reglas que
dicen lo mismo y solo pierden por ser menos específicas: en Baleares se citan
la ley balear y la Ley 7/2023.

### D56. Normas fuera del consolidado del BOE: `externas.json`

Las listas autonómicas de perros potencialmente peligrosos, varios seguros
mínimos, el plazo de identificación de Navarra y los reglamentos de Ceuta y
Melilla están en decretos que el BOE no consolida. Se citan desde su boletín
oficial en `src/datos/externas.json`, con enlace y fecha de verificación. Su
texto no lo extrae un programa: se copió del documento oficial (HTML o PDF)
y `pnpm datos:comprobar` verifica que cada cita esté en su artículo. Al
actualizar hay que releer la fuente.

`ppp.json` dice qué razas añade y qué seguro exige cada comunidad, apuntando a
esos artículos o a los del BOE:

| Comunidad                        | Razas que añade                                                          | Seguro mínimo                                  |
| -------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| Andalucía (D. 42/2008)           | Dóberman                                                                 | 175.000 € y curso de adiestramiento            |
| Canarias (D. 30/2018)            | —                                                                        | 200.000 €                                      |
| Castilla y León (D. 134/1999)    | Dogo del Tíbet                                                           | 30 millones de pesetas, solo razas de su anexo |
| Cataluña (Ley 10/1999)           | Bullmastiff, Dóberman, Dogo de Burdeos, Mastín napolitano, Presa canario | 150.253,03 €                                   |
| C. Valenciana (D. 145/2000)      | Las de Cataluña, más Bull terrier y Presa mallorquín                     | 20 millones de pesetas                         |
| Extremadura (Ley 5/2002)         | Las de Cataluña                                                          | —                                              |
| Galicia (Ley 4/2017, D. 90/2002) | Las de C. Valenciana, más Dogo del Tíbet                                 | 125.000 €                                      |
| País Vasco (D. 44/2020)          | American Bully, Akita americano, Bandogg                                 | —                                              |

Cantabria regula aparte las «razas de guarda y defensa» (D. 64/1999); una
ordenanza de 2025 publicada en el BOC las distingue de las PPP, así que no se
marcan como tales. Madrid (D. 30/2003) y Aragón aplican la lista estatal.

Ceuta (Reglamento 2/2015) y Melilla (Reglamento de Sanidad Animal, texto de 2022) entran como normas municipales (D34): microchip para perros, gatos y
hurones en las dos, censo en Ceuta y vacuna antirrábica anual en las dos.

### D57. Reformas anunciadas que el consolidado aún no incorpora

La Ley catalana 11/2026, de 9 de julio (DOGC núm. 9706), cambió las multas del
art. 46 del texto refundido catalán, pero el consolidado del BOE seguía con
las de 2020. Su análisis sí la anunciaba.

**Decisión**: el extractor descarga también `/analisis` y el generador falla si
cita un artículo al que se anuncia una reforma que no está entre sus
versiones. Solo se reconocen las reformas que nombran artículos; las de
«determinados preceptos» no se pueden atribuir. La cuantía catalana vigente
se cita desde la propia Ley 11/2026 (`externas.json`).

### D58. Cobertura tras la revisión

- **28 reglas autonómicas** en 15 comunidades, más 7 estatales y 3
  municipales (Ceuta y Melilla). Identificación obligatoria en los 19
  territorios; censo municipal en 11 comunidades y Ceuta; seguro propio
  exigible solo en el País Vasco (Murcia lo deja a un reglamento).
- Sin censo propio, y por tanto `sin_datos` (depende de la ordenanza):
  Galicia, Madrid, Murcia, Navarra, País Vasco, La Rioja y Melilla. En la
  Comunitat Valenciana el registro autonómico hace de censo.
- Cuadro de multas de cada ley autonómica, otras obligaciones propias
  (vacuna antirrábica, esterilización, correa, tiempo solo, número de
  animales, formación) y la ley de perros de asistencia de cada comunidad
  (Extremadura no tiene; su ley de accesibilidad reconoce el acceso).
- Queda fuera, y la metodología lo dice: ordenanzas municipales salvo Ceuta y
  Melilla, la vacuna antirrábica que fijan decretos u órdenes autonómicas, y
  el resto de reglamentos de desarrollo.

### D59. Lanzamiento: solo español, sin tema oscuro y en GitHub Pages

Sustituye a D4 y D5 (idiomas) y a la parte de D47 sobre el tema oscuro.

**Por qué**: decisión del propietario (30/10/2026) antes de publicar. GitHub
Pages admite webs de hasta 1 GB y, con las 8.132 fichas de municipio en dos
idiomas, el sitio ocupaba 1,3 GB.

**Decisión**:

- La web es solo en español: fuera las páginas `/en`, el catálogo inglés, el
  cambio de idioma y los `hreflang`. El texto sigue en catálogos JSON
  (`src/i18n/mensajes/`), sin parámetro de idioma.
- Sin tema oscuro: en su hueco de la cabecera va el botón «Colabora», que
  lleva a los donativos (`/apoya`). El formulario de errores (`/colabora`) se
  llama en la web «Avisar de un error».
- Sin migas de pan: el título de cada página va directamente bajo la
  cabecera.
- Publicación en GitHub Pages con `.github/workflows/despliegue.yml`. La URL
  sale de `PUBLIC_SITE_URL`, que puede llevar subcarpeta
  (`https://ivangarmar22.github.io/LeyAnimal`): `ruta()` (`src/lib/rutas.ts`)
  la antepone a todos los enlaces. El dominio previsto es `leyanimal.es`.
- Para que quepa con margen, los iconos de Lucide pierden al compilar sus
  atributos repetidos, que pasan a una regla CSS
  (`scripts/compactar-iconos.mjs`), y el logotipo se define una vez por
  página como `<symbol>`. El sitio compilado ocupa unos 450 MB.
- El formulario de avisos se envía con Web3Forms, que lo reenvía al correo
  del proyecto. La web sigue sin base de datos (D50).
