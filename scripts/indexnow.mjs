/**
 * Avisa a los buscadores que usan IndexNow (Bing, y con el DuckDuckGo, Yahoo
 * y Yandex) de todas las paginas de la web, leidas de los sitemaps publicados.
 * Google no usa IndexNow: descubre la web por el sitemap de robots.txt.
 *
 * Se ejecuta a mano tras un cambio grande de contenido: pnpm indexnow
 * La clave es publica: public/<clave>.txt demuestra que la web es nuestra.
 */
const SITIO = 'https://leyanimal.es';
const CLAVE = '1e9784111207f6cb39fd0931c37a2c6c';
const POR_ENVIO = 10_000;

const texto = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.text();
};
const locs = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const mapas = locs(await texto(`${SITIO}/sitemap-index.xml`));
const urls = (
  await Promise.all(mapas.map(async (m) => locs(await texto(m))))
).flat();

for (let i = 0; i < urls.length; i += POR_ENVIO) {
  const lote = urls.slice(i, i + POR_ENVIO);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITIO).host,
      key: CLAVE,
      keyLocation: `${SITIO}/${CLAVE}.txt`,
      urlList: lote,
    }),
  });
  console.log(`${lote.length} URL -> HTTP ${r.status}`);
  if (r.status >= 400) throw new Error(await r.text());
}
