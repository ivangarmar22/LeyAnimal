import { Check, Loader2, Search, type LucideIcon } from 'lucide-preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { cn } from '@/lib/cn';

export type Opcion = {
  /** Valor que se guarda (slug). */
  valor: string;
  principal: string;
  secundario?: string;
};

/**
 * Combobox con busqueda y el patron ARIA completo: role="combobox",
 * aria-expanded, aria-controls y aria-activedescendant, navegacion con
 * flechas, Enter para elegir y Escape para cerrar.
 */
export function Combobox<T extends Opcion>({
  id: idExterno,
  textoInicial,
  buscar,
  onElegir,
  onBorrar,
  etiqueta,
  ocultarEtiqueta = false,
  descripcion,
  marcador,
  sinResultados,
  cargando = false,
  alEnfocar,
  Icono = Search,
  class: clase,
}: {
  id?: string;
  textoInicial?: string;
  buscar: (termino: string) => T[];
  onElegir: (opcion: T) => void;
  onBorrar?: () => void;
  etiqueta: string;
  ocultarEtiqueta?: boolean;
  descripcion?: string;
  marcador?: string;
  /** Texto visible cuando la busqueda no encuentra nada. */
  sinResultados?: string;
  /** El indice aun se esta descargando. */
  cargando?: boolean;
  /** Para descargar el indice solo cuando alguien va a escribir. */
  alEnfocar?: () => void;
  Icono?: LucideIcon;
  class?: string;
}) {
  const generado = useId();
  const idBase = idExterno ?? generado;
  const idLista = `${idBase}-lista`;
  const idDescripcion = `${idBase}-desc`;
  const [texto, setTexto] = useState(textoInicial ?? '');
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(-1);
  const contenedor = useRef<HTMLDivElement>(null);

  // El texto inicial puede llegar despues (cuando se descarga el indice).
  useEffect(() => {
    if (textoInicial) setTexto(textoInicial);
  }, [textoInicial]);

  const termino = texto.trim();
  const sugerencias = termino.length >= 2 && !cargando ? buscar(termino) : [];

  useEffect(() => {
    const alPulsarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node))
        setAbierto(false);
    };
    document.addEventListener('mousedown', alPulsarFuera);
    return () => document.removeEventListener('mousedown', alPulsarFuera);
  }, []);

  function elegir(opcion: T) {
    setTexto(
      opcion.secundario
        ? `${opcion.principal} (${opcion.secundario})`
        : opcion.principal,
    );
    setAbierto(false);
    setResaltado(-1);
    onElegir(opcion);
  }

  function alPulsarTecla(evento: KeyboardEvent) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (!abierto) {
        setAbierto(true);
        return;
      }
      const paso = evento.key === 'ArrowDown' ? 1 : -1;
      setResaltado((actual) =>
        sugerencias.length === 0
          ? -1
          : (actual + paso + sugerencias.length) % sugerencias.length,
      );
      return;
    }
    if (evento.key === 'Enter' && abierto) {
      const elegido = sugerencias[resaltado >= 0 ? resaltado : 0];
      if (elegido) {
        evento.preventDefault();
        elegir(elegido);
      }
      return;
    }
    if (evento.key === 'Escape') {
      setAbierto(false);
      setResaltado(-1);
    }
  }

  const hayLista = abierto && sugerencias.length > 0;
  const vacio =
    abierto && termino.length >= 2 && !cargando && sugerencias.length === 0;

  return (
    <div ref={contenedor} class={cn('relative', clase)}>
      <label for={idBase} class={ocultarEtiqueta ? 'sr-only' : 'etiqueta'}>
        {etiqueta}
      </label>
      {descripcion ? (
        <p id={idDescripcion} class="ayuda">
          {descripcion}
        </p>
      ) : null}

      <div class="relative">
        <Icono
          class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-texto-3"
          aria-hidden
        />
        <input
          id={idBase}
          type="text"
          role="combobox"
          aria-expanded={hayLista}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-describedby={descripcion ? idDescripcion : undefined}
          aria-activedescendant={
            resaltado >= 0 ? `${idBase}-opcion-${resaltado}` : undefined
          }
          autoComplete="off"
          value={texto}
          onInput={(e) => {
            const valor = e.currentTarget.value;
            setTexto(valor);
            setAbierto(true);
            setResaltado(-1);
            if (valor === '') onBorrar?.();
          }}
          onFocus={() => {
            setAbierto(true);
            alEnfocar?.();
          }}
          onKeyDown={alPulsarTecla}
          placeholder={marcador}
          class="campo pr-12 pl-12"
        />
        {cargando && termino.length >= 2 ? (
          <Loader2
            class="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-texto-3"
            aria-hidden
          />
        ) : null}
      </div>

      <p class="sr-only" aria-live="polite">
        {hayLista
          ? String(sugerencias.length)
          : vacio
            ? (sinResultados ?? '0')
            : ''}
      </p>

      <ul
        id={idLista}
        role="listbox"
        aria-label={etiqueta}
        hidden={!hayLista}
        class="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-borde bg-superficie p-1.5 shadow-alta"
      >
        {sugerencias.map((opcion, indice) => (
          <li
            key={opcion.valor}
            id={`${idBase}-opcion-${indice}`}
            role="option"
            aria-selected={indice === resaltado}
            onMouseEnter={() => setResaltado(indice)}
            onMouseDown={(e) => {
              e.preventDefault();
              elegir(opcion);
            }}
            class={cn(
              'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-[0.9375rem]',
              indice === resaltado && 'bg-marca-50',
            )}
          >
            <span class="min-w-0 flex-1 truncate">
              <span class="font-medium text-texto">{opcion.principal}</span>
              {opcion.secundario ? (
                <span class="text-texto-3"> · {opcion.secundario}</span>
              ) : null}
            </span>
            {indice === resaltado ? (
              <Check class="size-4 text-marca-600" aria-hidden />
            ) : null}
          </li>
        ))}
      </ul>

      {vacio && sinResultados ? (
        <p class="mt-2 text-sm text-texto-3">{sinResultados}</p>
      ) : null}
    </div>
  );
}
