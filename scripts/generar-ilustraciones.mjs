/**
 * Genera las ilustraciones a color del sitio:
 *
 *   pnpm iconos
 *
 * Son de Fluent Emoji 3D (Microsoft, licencia MIT), que se publican como PNG
 * de alta resolucion en https://github.com/microsoft/fluentui-emoji. Cada una
 * se reduce a un WebP de 128 px en public/ilustraciones/: nitido hasta 3x en
 * el tamano en que se muestran (como mucho 48 px) y de unos pocos KB. La web
 * las carga con <img>, asi que el navegador las descarga una vez para todas
 * las paginas. src/lib/contenido/ilustraciones.ts recoge su nombre.
 *
 * No se usan las versiones SVG: sus decenas de filtros de desenfoque se ven
 * borrosos en pantallas con escalado.
 *
 * Para cambiar o anadir una, se edita SELECCION (nombre de la carpeta del
 * emoji en el repositorio) y se vuelve a ejecutar.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'src/lib/contenido/ilustraciones.ts');
const CARPETA = join(RAIZ, 'public/ilustraciones');
const REPO =
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets';
const LADO = 128;
const MARGEN = 6;
const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };

/** Nombre en el codigo -> carpeta del emoji en fluentui-emoji. */
const SELECCION = {
  // Especies
  perro: 'Dog face',
  gato: 'Cat face',
  huron: 'Otter',
  ave: 'Parrot',
  reptil: 'Turtle',
  pez: 'Tropical fish',
  roedor: 'Hamster',
  huellas: 'Paw prints',
  perroEntero: 'Dog',
  perroServicio: 'Service dog',
  perroGuia: 'Guide dog',
  // Situaciones
  manosCorazon: 'Heart hands',
  camion: 'Delivery truck',
  coche: 'Automobile',
  avion: 'Airplane',
  aviso: 'Warning',
  sirena: 'Police car light',
  brujula: 'Compass',
  // Temas y herramientas
  escudo: 'Shield',
  carne: 'Identification card',
  birrete: 'Graduation cap',
  estetoscopio: 'Stethoscope',
  lupa: 'Magnifying glass tilted left',
  balanza: 'Balance scale',
  bolsaDinero: 'Money bag',
  etiqueta: 'Label',
  documento: 'Page facing up',
  chincheta: 'Round pushpin',
  // Confianza, contacto y proyecto
  pergamino: 'Scroll',
  calendario: 'Spiral calendar',
  pensativo: 'Thinking face',
  corazonVerde: 'Green heart',
  corazon: 'Red heart',
  correo: 'E-mail',
  nota: 'Memo',
  visto: 'Check mark button',
  abrazo: 'People hugging',
  megafono: 'Megaphone',
  // Donativos
  movil: 'Mobile phone',
  tarjetaPago: 'Credit card',
  // Que hacer si
  tirita: 'Adhesive bandage',
  corazonRoto: 'Broken heart',
  paloma: 'Dove',
};

/** PNG 3D de un emoji; los que tienen tono de piel, en su version por defecto. */
async function descargar(carpeta) {
  const fichero = carpeta.toLowerCase().replaceAll(' ', '_');
  const base = `${REPO}/${encodeURIComponent(carpeta)}`;
  for (const url of [
    `${base}/3D/${fichero}_3d.png`,
    `${base}/Default/3D/${fichero}_3d_default.png`,
  ]) {
    const r = await fetch(url);
    if (r.ok) return Buffer.from(await r.arrayBuffer());
  }
  throw new Error(`No existe en fluentui-emoji: ${carpeta}`);
}

await rm(CARPETA, { recursive: true, force: true });
await mkdir(CARPETA, { recursive: true });
const lineas = [];
for (const [nombre, carpeta] of Object.entries(SELECCION)) {
  const png = await descargar(carpeta);
  // Cada PNG trae un margen transparente distinto (la tarjeta, mucho arriba y
  // poco abajo): se recorta y el dibujo se centra con el mismo margen en los
  // cuatro lados, para que todas queden alineadas con su texto.
  const dibujo = await sharp(png).trim().toBuffer();
  await sharp(dibujo)
    .resize(LADO - 2 * MARGEN, LADO - 2 * MARGEN, {
      fit: 'contain',
      background: TRANSPARENTE,
    })
    .extend({
      top: MARGEN,
      bottom: MARGEN,
      left: MARGEN,
      right: MARGEN,
      background: TRANSPARENTE,
    })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(join(CARPETA, `${nombre}.webp`));
  lineas.push(
    `/** ${carpeta} */\nexport const ${nombre}: IconoColor = { nombre: '${nombre}' };`,
  );
}

await writeFile(
  DESTINO,
  `/**
 * Ilustraciones a color del sitio. GENERADO por
 * scripts/generar-ilustraciones.mjs: no editar a mano (pnpm iconos). Cada una
 * es un WebP de public/ilustraciones/ que pinta src/ui/Ilustracion.tsx.
 *
 * Fluent Emoji, Copyright (c) Microsoft Corporation. Licencia MIT:
 * https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE
 */

export type IconoColor = { nombre: string };

${lineas.join('\n\n')}
`,
  'utf8',
);
console.log(`Escrito ${DESTINO} y ${lineas.length} WebP en ${CARPETA}.`);
