/**
 * Genera la imagen para compartir (Open Graph, 1200x630,
 * public/og/leyanimal.png) y el icono de pantalla de inicio de iOS
 * (public/apple-touch-icon.png, 180x180).
 *
 * Se ejecuta a mano cuando cambian el logotipo o el titular de la portada:
 *   pnpm og
 * Usa el Chrome instalado en el equipo en modo headless (variable CHROME
 * para indicar otra ruta), sin dependencias nuevas.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import {
  ALMOHADILLA,
  DEDOS,
  ESCUDO,
  simboloSvg,
} from '../src/componentes/marca/formas.ts';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const fuentes = pathToFileURL(join(raiz, 'public/fuentes/')).href;

const CANDIDATOS = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const chromeRuta = CANDIDATOS.find((c) => c && existsSync(c));
if (!chromeRuta)
  throw new Error(
    'No se encuentra Chrome: indica la ruta en la variable CHROME',
  );

const girar = (cx, cy, g) => `rotate(${g} ${cx} ${cy})`;
const dedos = (lista) =>
  lista
    .map(
      ([cx, cy, rx, ry, g]) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="${girar(cx, cy, g)}"/>`,
    )
    .join('');

const simbolo = simboloSvg(
  'width="64" height="70" style="filter: drop-shadow(0 3px 5px rgb(11 74 48 / 0.3))"',
);

const trazo = `<svg viewBox="0 0 48 52" class="trazo">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#86d4ab"/><stop offset="0.6" stop-color="#23a36a"/><stop offset="1" stop-color="#16804f"/>
  </linearGradient></defs>
  <g fill="none" stroke="url(#g)" stroke-width="0.45" stroke-linejoin="round">
    <path d="${ESCUDO}"/><path d="${ALMOHADILLA}"/>${dedos(DEDOS)}
  </g>
</svg>`;

const pagina = ({ titulo1, titulo2, pie }) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><style>
@font-face { font-family: Sora; src: url('${fuentes}sora.woff2') format('woff2'); font-weight: 100 900; }
@font-face { font-family: Geist; src: url('${fuentes}geist.woff2') format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; font-family: Geist, sans-serif; color: #15241c;
  background: radial-gradient(900px 520px at 88% 0%, #dff3e8 0%, rgba(223,243,232,0) 70%), linear-gradient(180deg, #f2f9f5 0%, #ffffff 100%); }
.rejilla { position: absolute; inset: 0; background-image: linear-gradient(#e2ece6 1px, transparent 1px), linear-gradient(90deg, #e2ece6 1px, transparent 1px);
  background-size: 48px 48px; mask-image: radial-gradient(700px 420px at 80% 30%, #000 0%, transparent 75%); opacity: .7; }
.trazo { position: absolute; right: -150px; top: 60px; width: 540px; opacity: .75; }
.contenido { position: absolute; inset: 72px 80px; display: flex; flex-direction: column; }
.logo { display: flex; align-items: center; gap: 16px; font-family: Sora; font-weight: 600; font-size: 44px; letter-spacing: -0.035em; }
.logo span { color: #16804f; }
h1 { margin-top: auto; max-width: 780px; text-wrap: balance; font-family: Sora; font-weight: 600; font-size: 64px; line-height: 1.08; letter-spacing: -0.035em; }
h1 em { font-style: normal; color: #16804f; }
p { margin-top: 28px; font-size: 26px; color: #3b4d43; }
</style></head><body>
<div class="rejilla"></div>${trazo}
<div class="contenido">
  <div class="logo">${simbolo}<div>Ley<span>Animal</span></div></div>
  <h1>${titulo1} <em>${titulo2}</em></h1>
  <p>${pie}</p>
</div>
</body></html>`;

const perfil = await mkdtemp(join(tmpdir(), 'og-'));
const puerto = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(
  chromeRuta,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${puerto}`,
    `--user-data-dir=${perfil}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let destinos;
  for (let i = 0; i < 50 && !destinos; i++) {
    destinos = await fetch(`http://127.0.0.1:${puerto}/json`)
      .then((r) => r.json())
      .catch(() => espera(200));
  }
  const ws = new WebSocket(
    destinos.find((d) => d.type === 'page').webSocketDebuggerUrl,
  );
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pendientes = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    pendientes.get(m.id)?.(m);
    pendientes.delete(m.id);
  });
  const cdp = (method, params = {}) =>
    new Promise((r) => {
      const n = ++id;
      pendientes.set(n, r);
      ws.send(JSON.stringify({ id: n, method, params }));
    });

  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await mkdir(join(raiz, 'public/og'), { recursive: true });
  const { inicio } = JSON.parse(
    await readFile(join(raiz, 'src/i18n/mensajes/inicio.json'), 'utf8'),
  );
  const html = join(perfil, 'og.html');
  await writeFile(
    html,
    pagina({
      titulo1: inicio.hero.titulo1,
      titulo2: inicio.hero.titulo2,
      pie: 'Citas literales del BOE · Gratis y sin publicidad',
    }),
  );
  await cdp('Page.navigate', { url: pathToFileURL(html).href });
  await espera(1500);
  await cdp('Runtime.evaluate', {
    expression: 'document.fonts.ready',
    awaitPromise: true,
  });
  const foto = await cdp('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 },
  });
  await writeFile(
    join(raiz, 'public/og/leyanimal.png'),
    Buffer.from(foto.result.data, 'base64'),
  );
  console.log('public/og/leyanimal.png');

  // iOS no usa el favicon SVG: el simbolo sobre blanco, con margen
  const icono = await sharp(Buffer.from(simboloSvg('width="128" height="139"')))
    .png()
    .toBuffer();
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: '#ffffff' },
  })
    .composite([{ input: icono, gravity: 'center' }])
    .png()
    .toFile(join(raiz, 'public/apple-touch-icon.png'));
  console.log('public/apple-touch-icon.png');
  ws.close();
} finally {
  chrome.kill();
  await espera(300);
  await rm(perfil, { recursive: true, force: true }).catch(() => {});
}
