import { Search } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { ruta } from '@/lib/rutas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import { normalizar } from '@/lib/datos/busqueda';

/**
 * Lista de municipios de una provincia con filtro instantaneo. El HTML ya
 * trae la lista completa (enlazado interno para buscadores); el filtro es
 * una mejora que llega al hidratar.
 */
export default function ListaMunicipios({
  textos,
  municipios,
}: {
  textos: Mensajes;
  municipios: { slug: string; nombre: string; capital: boolean }[];
}) {
  const tg = crearTraductor(textos);
  const t = tg.en('provincia');
  const [texto, setTexto] = useState('');
  const filtro = normalizar(texto.trim());
  const visibles = filtro
    ? municipios.filter((m) => normalizar(m.nombre).includes(filtro))
    : municipios;

  return (
    <div>
      <div class="relative max-w-md">
        <label for="filtrar-municipios" class="sr-only">
          {t('filtrar')}
        </label>
        <Search
          class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-texto-3"
          aria-hidden
        />
        <input
          id="filtrar-municipios"
          type="search"
          value={texto}
          onInput={(e) => setTexto(e.currentTarget.value)}
          placeholder={t('filtrarMarcador')}
          class="campo pl-12"
        />
      </div>
      <p class="mt-4 text-sm text-texto-3" aria-live="polite">
        {tg('comun.resultados', { cuenta: visibles.length })}
      </p>
      <ul class="mt-4 columns-1 gap-x-8 sm:columns-2 lg:columns-3 xl:columns-4">
        {visibles.map((m) => (
          <li key={m.slug} class="break-inside-avoid">
            <a
              href={ruta(`/municipios/${m.slug}`)}
              class="flex min-h-11 items-center gap-2 border-b border-borde py-2 text-[0.9375rem] text-texto-2 transition-colors hover:text-marca-700"
            >
              {m.nombre}
              {m.capital ? (
                <span class="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-semibold text-marca-700">
                  {t('capital')}
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
