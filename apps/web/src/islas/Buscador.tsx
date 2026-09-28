import {
  BookOpen,
  CornerDownLeft,
  Landmark,
  Loader2,
  MapPin,
  Search,
  Tag,
  type LucideIcon,
} from 'lucide-preact';
import { useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import { ruta, type Idioma } from '@/i18n/idiomas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import { normalizar } from '@/lib/datos/busqueda';
import { provincias } from '@/lib/datos/geografia';
import {
  cargarMunicipios,
  type IndiceMunicipios,
} from '@/lib/datos/cargar-municipios';
import { cn } from '@/lib/cn';

type Tipo = 'municipio' | 'comunidad' | 'norma' | 'tema';
type Resultado = { tipo: Tipo; titulo: string; detalle?: string; href: string };
/** /datos/busqueda-{idioma}.json: nombres ya traducidos. */
export type IndiceBusqueda = {
  comunidades: { titulo: string; href: string }[];
  normas: { titulo: string; detalle: string; href: string }[];
  temas: { titulo: string; href: string }[];
};

const ICONOS: Record<Tipo, LucideIcon> = {
  municipio: MapPin,
  comunidad: Landmark,
  norma: BookOpen,
  tema: Tag,
};
const nombreProvincia = new Map(
  provincias().map((p) => [p.codigoIne, p.nombre]),
);

/**
 * Buscador global: municipios, comunidades, normas y guias en un solo campo.
 * Se abre con Ctrl+K / Cmd+K. El indice (unos 110 KB comprimidos) solo se
 * descarga la primera vez que alguien abre el buscador.
 */
export default function Buscador({
  idioma,
  textos,
}: {
  idioma: Idioma;
  textos: Mensajes;
}) {
  const t = crearTraductor(textos, idioma, 'buscador');
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);
  const [datos, setDatos] = useState<{
    indice: IndiceBusqueda;
    municipios: IndiceMunicipios;
  } | null>(null);
  const [cargando, setCargando] = useState(false);

  async function abrir() {
    dialogo.current?.showModal();
    if (datos || cargando) return;
    setCargando(true);
    try {
      const [municipios, indice] = await Promise.all([
        cargarMunicipios(),
        fetch(`/datos/busqueda-${idioma}.json`).then(
          (r) => r.json() as Promise<IndiceBusqueda>,
        ),
      ]);
      setDatos({ indice, municipios });
    } finally {
      setCargando(false);
    }
  }

  // Atajo de teclado global
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dialogo.current?.open) dialogo.current.close();
        else void abrir();
      }
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  });

  const termino = texto.trim();
  const lista = useMemo<Resultado[]>(() => {
    if (!datos || termino.length < 2) return [];
    const n = normalizar(termino);
    const contiene = (s: string) => normalizar(s).includes(n);
    return [
      ...datos.municipios.buscar(termino, 5).map((m) => ({
        tipo: 'municipio' as const,
        titulo: m.nombre,
        detalle: nombreProvincia.get(m.provincia),
        href: `/municipios/${m.slug}`,
      })),
      ...datos.indice.comunidades
        .filter((c) => contiene(c.titulo))
        .slice(0, 3)
        .map((c) => ({ tipo: 'comunidad' as const, ...c })),
      ...datos.indice.normas
        .filter((x) => contiene(`${x.titulo} ${x.detalle}`))
        .slice(0, 4)
        .map((x) => ({ tipo: 'norma' as const, ...x })),
      ...datos.indice.temas
        .filter((x) => contiene(x.titulo))
        .slice(0, 3)
        .map((x) => ({ tipo: 'tema' as const, ...x })),
    ];
  }, [datos, termino]);

  function ir(r: Resultado | undefined) {
    if (r) window.location.assign(ruta(r.href, idioma));
  }

  function alTeclear(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (lista.length === 0) return;
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      setActivo((a) => (a + paso + lista.length) % lista.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      ir(lista[activo]);
    }
  }

  const idLista = `${id}-lista`;
  const esperando = cargando && termino.length >= 2;

  return (
    <>
      <button
        type="button"
        class="boton-buscar"
        onClick={() => void abrir()}
        aria-label={t('abrir')}
      >
        <Search class="size-[18px]" aria-hidden />
        <span class="hidden xl:inline">{t('buscar')}</span>
        <kbd class="hidden rounded-md border border-borde px-1.5 py-0.5 font-mono text-[0.7rem] text-texto-3 xl:inline">
          Ctrl K
        </kbd>
      </button>

      <dialog
        ref={dialogo}
        class="buscador"
        aria-label={t('titulo')}
        onClick={(e) => {
          // Clic en el fondo (fuera de la caja) cierra.
          if (e.target === dialogo.current) dialogo.current?.close();
        }}
      >
        <div class="flex items-center gap-3 border-b border-borde px-4">
          <Search class="size-5 shrink-0 text-texto-3" aria-hidden />
          <input
            autoFocus
            value={texto}
            onInput={(e) => {
              setTexto(e.currentTarget.value);
              setActivo(0);
            }}
            onKeyDown={alTeclear}
            role="combobox"
            aria-expanded={lista.length > 0}
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={lista.length ? `${id}-${activo}` : undefined}
            aria-label={t('titulo')}
            placeholder={t('marcador')}
            class="h-14 w-full bg-transparent text-base text-texto outline-none placeholder:text-texto-3"
          />
          {esperando ? (
            <Loader2 class="size-5 animate-spin text-texto-3" aria-hidden />
          ) : null}
        </div>

        <p class="sr-only" aria-live="polite">
          {termino.length >= 2 && datos
            ? t('resultados', { cuenta: lista.length })
            : ''}
        </p>

        <ul
          id={idLista}
          role="listbox"
          aria-label={t('titulo')}
          class="max-h-[55vh] overflow-y-auto p-2"
        >
          {lista.map((r, i) => {
            const Icono = ICONOS[r.tipo];
            const cabecera = i === 0 || lista[i - 1]?.tipo !== r.tipo;
            return (
              <li key={`${r.tipo}-${r.href}`} role="presentation">
                {cabecera ? (
                  <p role="presentation" class="rotulo px-3 pt-3 pb-1.5">
                    {t(`tipos.${r.tipo}`)}
                  </p>
                ) : null}
                <div
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={i === activo}
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => ir(r)}
                  class={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5',
                    i === activo && 'bg-marca-50',
                  )}
                >
                  <span class="caja-icono size-9 rounded-lg">
                    <Icono class="size-[18px]" aria-hidden />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-medium text-texto">
                      {r.titulo}
                    </span>
                    {r.detalle ? (
                      <span class="block truncate text-sm text-texto-3">
                        {r.detalle}
                      </span>
                    ) : null}
                  </span>
                  {i === activo ? (
                    <CornerDownLeft class="size-4 text-texto-3" aria-hidden />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {termino.length >= 2 && datos && lista.length === 0 ? (
          <p class="px-5 pb-6 text-sm text-texto-3">{t('sinResultados')}</p>
        ) : null}
        {termino.length < 2 ? (
          <p class="px-5 pb-5 text-sm text-texto-3">{t('ayuda')}</p>
        ) : null}
      </dialog>
    </>
  );
}
