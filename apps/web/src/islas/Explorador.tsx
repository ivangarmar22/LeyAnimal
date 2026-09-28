import type { Ambito } from '@leyanimal/reglas';
import { ArrowRight, LayoutList, Search, Table2 } from 'lucide-preact';
import { useMemo, useState } from 'preact/hooks';
import { ruta, type Idioma } from '@/i18n/idiomas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import { normalizar } from '@/lib/datos/busqueda';
import type { EstadoNorma } from '@/lib/datos/tipos';
import { cn } from '@/lib/cn';
import { ChipAmbito, ChipNorma } from '@/ui/Chips';

export type NormaResumen = {
  slug: string;
  nombre: string;
  titulo: string;
  ambito: Ambito;
  comunidad: string | null;
  estado: EstadoNorma;
  articulos: number;
  verificada: string | null;
};

/**
 * Explorador de normas. Son unas decenas, asi que se filtran en el navegador
 * y la pagina sigue siendo estatica (el listado completo va en el HTML).
 */
export default function Explorador({
  idioma,
  textos,
  normas,
}: {
  idioma: Idioma;
  textos: Mensajes;
  normas: NormaResumen[];
}) {
  const tg = crearTraductor(textos, idioma);
  const t = tg.en('normativa');
  const tc = tg.en('comun');

  const [texto, setTexto] = useState('');
  const [ambito, setAmbito] = useState('');
  const [comunidad, setComunidad] = useState('');
  const [estado, setEstado] = useState('');
  const [vista, setVista] = useState<'lista' | 'tabla'>('lista');

  const comunidades = useMemo(
    () =>
      [
        ...new Set(
          normas.map((n) => n.comunidad).filter((c): c is string => Boolean(c)),
        ),
      ].sort((a, b) => a.localeCompare(b, 'es')),
    [normas],
  );
  const ambitos = useMemo(
    () => [...new Set(normas.map((n) => n.ambito))],
    [normas],
  );
  const estados = useMemo(
    () => [...new Set(normas.map((n) => n.estado))],
    [normas],
  );

  const busqueda = normalizar(texto.trim());
  const filtradas = normas.filter(
    (n) =>
      (!busqueda || normalizar(`${n.nombre} ${n.titulo}`).includes(busqueda)) &&
      (!ambito || n.ambito === ambito) &&
      (!comunidad || n.comunidad === comunidad) &&
      (!estado || n.estado === estado),
  );
  const hayFiltros = Boolean(texto || ambito || comunidad || estado);

  return (
    <div>
      <div class="grid gap-3 rounded-3xl border border-borde bg-superficie p-4 shadow-media sm:p-5 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
        <div class="relative">
          <label for="buscar-norma" class="sr-only">
            {t('buscar')}
          </label>
          <Search
            class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-texto-3"
            aria-hidden
          />
          <input
            id="buscar-norma"
            type="search"
            value={texto}
            onInput={(e) => setTexto(e.currentTarget.value)}
            placeholder={t('buscar')}
            class="campo pl-12"
          />
        </div>
        <Filtro
          id="f-ambito"
          etiqueta={t('ambito')}
          valor={ambito}
          onCambiar={setAmbito}
          todos={tc('todos')}
          opciones={ambitos.map((a) => [a, tg(`ambitos.${a}`)])}
        />
        <Filtro
          id="f-comunidad"
          etiqueta={t('comunidad')}
          valor={comunidad}
          onCambiar={setComunidad}
          todos={tc('todas')}
          opciones={comunidades.map((c) => [c, c])}
        />
        <Filtro
          id="f-estado"
          etiqueta={t('estado')}
          valor={estado}
          onCambiar={setEstado}
          todos={tc('todos')}
          opciones={estados.map((e) => [e, tg(`estadosNorma.${e}`)])}
        />
      </div>

      <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p class="text-[0.9375rem] text-texto-2" aria-live="polite">
          {tc('resultados', { cuenta: filtradas.length })}
          {hayFiltros ? (
            <button
              type="button"
              class="ml-3 text-sm font-medium text-marca-700 underline underline-offset-2"
              onClick={() => {
                setTexto('');
                setAmbito('');
                setComunidad('');
                setEstado('');
              }}
            >
              {tc('limpiar')}
            </button>
          ) : null}
        </p>
        <div
          class="inline-flex rounded-full border border-borde bg-superficie p-1"
          role="group"
          aria-label={t('vista')}
        >
          {(
            [
              ['lista', LayoutList],
              ['tabla', Table2],
            ] as const
          ).map(([v, Icono]) => (
            <button
              key={v}
              type="button"
              aria-pressed={vista === v}
              onClick={() => setVista(v)}
              class={cn(
                'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
                vista === v
                  ? 'bg-marca-600 text-sobre-marca'
                  : 'text-texto-3 hover:text-texto',
              )}
            >
              <Icono class="size-4" aria-hidden />
              {t(v)}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p class="mt-8 rounded-3xl border border-dashed border-borde-fuerte p-8 text-center">
          {t('sinResultados')}
        </p>
      ) : vista === 'lista' ? (
        <ul class="mt-6 grid gap-3 lg:grid-cols-2">
          {filtradas.map((n) => (
            <li key={n.slug}>
              <a
                href={ruta(`/normativa/${n.slug}`, idioma)}
                class="tarjeta tarjeta--interactiva h-full gap-3 p-5 sm:p-6"
              >
                <span class="flex flex-wrap gap-2">
                  <ChipAmbito ambito={n.ambito} t={tg} />
                  <ChipNorma estado={n.estado} t={tg} />
                </span>
                <span class="font-display text-lg font-semibold text-texto">
                  {n.nombre}
                </span>
                <span class="text-[0.9375rem]" lang="es">
                  {n.titulo}
                </span>
                <span class="mt-auto flex items-center justify-between gap-3 border-t border-borde pt-3 text-sm text-texto-3">
                  <span>{t('articulos', { n: n.articulos })}</span>
                  <ArrowRight class="size-4" aria-hidden />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div class="mt-6 rounded-3xl border border-borde bg-superficie md:p-2">
          <table class="tabla tabla--apilable">
            <thead>
              <tr>
                <th scope="col">{t('colNorma')}</th>
                <th scope="col">{t('colAmbito')}</th>
                <th scope="col">{t('colEstado')}</th>
                <th scope="col">{t('colArticulos')}</th>
                <th scope="col">{t('colVerificada')}</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((n) => (
                <tr key={n.slug}>
                  <td>
                    <a
                      href={ruta(`/normativa/${n.slug}`, idioma)}
                      class="font-medium text-texto underline-offset-2 hover:underline"
                    >
                      {n.nombre}
                    </a>
                  </td>
                  <td data-etiqueta={t('colAmbito')}>
                    <ChipAmbito ambito={n.ambito} t={tg} />
                  </td>
                  <td data-etiqueta={t('colEstado')}>
                    <ChipNorma estado={n.estado} t={tg} />
                  </td>
                  <td data-etiqueta={t('colArticulos')} class="cifras">
                    {n.articulos}
                  </td>
                  <td data-etiqueta={t('colVerificada')} class="cifras">
                    {n.verificada ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Filtro({
  id,
  etiqueta,
  valor,
  onCambiar,
  opciones,
  todos,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onCambiar: (v: string) => void;
  opciones: [string, string][];
  todos: string;
}) {
  return (
    <div>
      <label for={id} class="sr-only">
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onCambiar(e.currentTarget.value)}
        class="campo"
      >
        <option value="">
          {etiqueta}: {todos}
        </option>
        {opciones.map(([v, texto]) => (
          <option key={v} value={v}>
            {texto}
          </option>
        ))}
      </select>
    </div>
  );
}
