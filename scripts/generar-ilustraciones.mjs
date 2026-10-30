/**
 * Genera src/lib/contenido/ilustraciones.ts: los iconos a color del sitio.
 *
 *   pnpm iconos
 *
 * Son de Fluent Emoji Flat (Microsoft, licencia MIT) y se descargan del
 * catalogo de Iconify. Solo los de la seleccion, cada uno como exportacion
 * propia: las islas del navegador importan los suyos y no el juego entero.
 * Para cambiar o anadir uno, se edita SELECCION y se vuelve a ejecutar.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const COLECCION = 'fluent-emoji-flat';
const DESTINO = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src/lib/contenido/ilustraciones.ts',
);

/** Nombre en el codigo -> nombre en Fluent Emoji. */
const SELECCION = {
  // Especies
  perro: 'dog-face',
  gato: 'cat-face',
  huron: 'otter',
  ave: 'parrot',
  reptil: 'turtle',
  pez: 'tropical-fish',
  roedor: 'hamster',
  huellas: 'paw-prints',
  perroEntero: 'dog',
  perroServicio: 'service-dog',
  perroGuia: 'guide-dog',
  // Situaciones
  manosCorazon: 'heart-hands',
  camion: 'delivery-truck',
  coche: 'automobile',
  avion: 'airplane',
  aviso: 'warning',
  sirena: 'police-car-light',
  brujula: 'compass',
  // Temas y herramientas
  escudo: 'shield',
  carne: 'identification-card',
  birrete: 'graduation-cap',
  estetoscopio: 'stethoscope',
  lupa: 'magnifying-glass-tilted-left',
  balanza: 'balance-scale',
  bolsaDinero: 'money-bag',
  etiqueta: 'label',
  documento: 'page-facing-up',
  chincheta: 'round-pushpin',
  // Confianza, contacto y proyecto
  pergamino: 'scroll',
  calendario: 'spiral-calendar',
  pensativo: 'thinking-face',
  corazonVerde: 'green-heart',
  correo: 'e-mail',
  nota: 'memo',
  visto: 'check-mark-button',
  abrazo: 'people-hugging',
  // Que hacer si
  tirita: 'adhesive-bandage',
  corazonRoto: 'broken-heart',
  paloma: 'dove',
};

const nombres = [...new Set(Object.values(SELECCION))];
const respuesta = await fetch(
  `https://api.iconify.design/${COLECCION}.json?icons=${nombres.join(',')}`,
);
if (!respuesta.ok) throw new Error(`Iconify: HTTP ${respuesta.status}`);
const datos = await respuesta.json();
if (datos.not_found?.length)
  throw new Error(`No existen en ${COLECCION}: ${datos.not_found.join(', ')}`);

const ancho = datos.width ?? 16;
const alto = datos.height ?? 16;
const lineas = Object.entries(SELECCION).map(([nombre, icono]) => {
  const { width = ancho, height = alto } = datos.icons[icono];
  const body = datos.icons[icono].body;
  return `/** ${icono} */\nexport const ${nombre}: IconoColor = { cuerpo: ${JSON.stringify(body)}, ancho: ${width}, alto: ${height} };`;
});

await writeFile(
  DESTINO,
  `/**
 * Iconos a color del sitio. GENERADO por scripts/generar-ilustraciones.mjs:
 * no editar a mano (pnpm iconos).
 *
 * Fluent Emoji Flat, Copyright (c) Microsoft Corporation. Licencia MIT:
 * https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE
 */

export type IconoColor = { cuerpo: string; ancho: number; alto: number };

${lineas.join('\n\n')}
`,
  'utf8',
);
console.log(`Escrito ${DESTINO}: ${lineas.length} iconos.`);
