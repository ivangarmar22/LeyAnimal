import {
  Clock,
  HelpCircle,
  Info,
  Minus,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-preact';
import type { Ambito, EstadoRequisito } from '@/lib/reglas';

type ConfiguracionEstado = {
  Icono: LucideIcon;
  /** Clases de chip: texto, fondo y borde propios del estado. */
  chip: string;
  /** Clases para el bloque contenedor de una tarjeta de requisito. */
  bloque: string;
  /** Franja izquierda de la tarjeta de obligacion, en el color del estado. */
  acento: string;
};

/**
 * La informacion de estado nunca se comunica solo por color: cada entrada
 * lleva icono, y la etiqueta de texto la aporta el catalogo.
 */
export const ESTADOS: Record<EstadoRequisito, ConfiguracionEstado> = {
  obligatorio: {
    Icono: ShieldAlert,
    chip: 'text-obligatorio-texto bg-obligatorio-fondo border-obligatorio-borde',
    bloque: 'bg-obligatorio-fondo border-obligatorio-borde',
    acento: 'border-l-obligatorio-texto',
  },
  obligatorio_pendiente_reglamento: {
    Icono: Clock,
    chip: 'text-pendiente-texto bg-pendiente-fondo border-pendiente-borde',
    bloque: 'bg-pendiente-fondo border-pendiente-borde',
    acento: 'border-l-pendiente-texto',
  },
  recomendado: {
    Icono: Info,
    chip: 'text-recomendado-texto bg-recomendado-fondo border-recomendado-borde',
    bloque: 'bg-recomendado-fondo border-recomendado-borde',
    acento: 'border-l-recomendado-texto',
  },
  no_aplica: {
    Icono: Minus,
    chip: 'text-noaplica-texto bg-noaplica-fondo border-noaplica-borde',
    bloque: 'bg-noaplica-fondo border-noaplica-borde',
    acento: 'border-l-noaplica-borde',
  },
  sin_datos: {
    Icono: HelpCircle,
    chip: 'text-sindatos-texto bg-sindatos-fondo border-sindatos-borde',
    bloque: 'bg-sindatos-fondo border-sindatos-borde',
    acento: 'border-l-sindatos-texto',
  },
};

/** Orden de mayor a menor exigencia. Define como se agrupan los resultados. */
export const ORDEN_ESTADOS: readonly EstadoRequisito[] = [
  'obligatorio',
  'obligatorio_pendiente_reglamento',
  'recomendado',
  'sin_datos',
  'no_aplica',
];

/** Chips de ambito: discretos, solo borde y texto. */
export const AMBITOS: Record<Ambito, string> = {
  estatal: 'text-ambito-estatal border-ambito-estatal',
  autonomico: 'text-ambito-autonomico border-ambito-autonomico',
  provincial: 'text-ambito-provincial border-ambito-provincial',
  municipal: 'text-ambito-municipal border-ambito-municipal',
};
