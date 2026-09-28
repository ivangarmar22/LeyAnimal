import { Monitor, Moon, Sun } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import type { Idioma } from '@/i18n/idiomas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import { cn } from '@/lib/cn';

type Tema = 'light' | 'dark' | 'sistema';

const CLAVE = 'tema';

const OPCIONES = [
  { valor: 'light', Icono: Sun, clave: 'claro' },
  { valor: 'dark', Icono: Moon, clave: 'oscuro' },
  { valor: 'sistema', Icono: Monitor, clave: 'sistema' },
] as const;

function leer(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return guardado === 'dark' || guardado === 'sistema' ? guardado : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Tema claro por defecto (DECISIONES.md, D47). El oscuro, o seguir al
 * sistema, solo si la persona lo elige. Se guarda en el navegador y lo aplica
 * antes del primer pintado el script en linea del layout.
 */
export default function SelectorTema({
  idioma,
  textos,
}: {
  idioma: Idioma;
  textos: Mensajes;
}) {
  const t = crearTraductor(textos, idioma, 'tema');
  const [tema, setTema] = useState<Tema>('light');

  // El servidor no conoce la preferencia: se lee al montar.
  useEffect(() => setTema(leer()), []);

  function cambiar(nuevo: Tema) {
    try {
      if (nuevo === 'light') {
        localStorage.removeItem(CLAVE);
        document.documentElement.removeAttribute('data-theme');
      } else {
        localStorage.setItem(CLAVE, nuevo);
        document.documentElement.setAttribute('data-theme', nuevo);
      }
    } catch {
      // Almacenamiento no disponible: se queda el tema claro.
    }
    setTema(nuevo);
  }

  return (
    <div
      class="inline-flex rounded-full border border-borde bg-superficie p-0.5"
      role="radiogroup"
      aria-label={t('etiqueta')}
    >
      {OPCIONES.map(({ valor, Icono, clave }) => {
        const activo = tema === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => cambiar(valor)}
            class={cn(
              'inline-flex size-9 items-center justify-center rounded-full transition-colors',
              activo
                ? 'bg-marca-600 text-sobre-marca'
                : 'text-texto-3 hover:bg-marca-50 hover:text-texto',
            )}
          >
            <Icono class="size-4" aria-hidden />
            <span class="sr-only">{t(clave)}</span>
          </button>
        );
      })}
    </div>
  );
}
