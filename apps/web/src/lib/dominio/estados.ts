import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Minus,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-preact';
import type { Ambito, EstadoRequisito } from '@leyanimal/reglas';

/**
 * Estados que puede mostrar la interfaz. Amplia los del motor de reglas con
 * 'cumplido', que no lo decide la norma sino el usuario al marcarlo.
 */
export type EstadoVisual = EstadoRequisito | 'cumplido';

type ConfiguracionEstado = {
  Icono: LucideIcon;
  /** Clases de chip: texto, fondo y borde propios del estado. */
  chip: string;
  /** Clases para el bloque contenedor de una tarjeta de requisito. */
  bloque: string;
};

/**
 * La informacion de estado nunca se comunica solo por color: cada entrada
 * lleva icono, y la etiqueta de texto la aporta el catalogo de idioma.
 */
export const ESTADOS: Record<EstadoVisual, ConfiguracionEstado> = {
  obligatorio: {
    Icono: ShieldAlert,
    chip: 'text-obligatorio-texto bg-obligatorio-fondo border-obligatorio-borde',
    bloque: 'bg-obligatorio-fondo border-obligatorio-borde',
  },
  obligatorio_pendiente_reglamento: {
    Icono: Clock,
    chip: 'text-pendiente-texto bg-pendiente-fondo border-pendiente-borde',
    bloque: 'bg-pendiente-fondo border-pendiente-borde',
  },
  recomendado: {
    Icono: Info,
    chip: 'text-recomendado-texto bg-recomendado-fondo border-recomendado-borde',
    bloque: 'bg-recomendado-fondo border-recomendado-borde',
  },
  no_aplica: {
    Icono: Minus,
    chip: 'text-noaplica-texto bg-noaplica-fondo border-noaplica-borde',
    bloque: 'bg-noaplica-fondo border-noaplica-borde',
  },
  sin_datos: {
    Icono: HelpCircle,
    chip: 'text-sindatos-texto bg-sindatos-fondo border-sindatos-borde',
    bloque: 'bg-sindatos-fondo border-sindatos-borde',
  },
  cumplido: {
    Icono: CheckCircle2,
    chip: 'text-cumplido-texto bg-cumplido-fondo border-cumplido-borde',
    bloque: 'bg-cumplido-fondo border-cumplido-borde',
  },
};

/** Orden de mayor a menor exigencia. Define como se agrupan los resultados. */
export const ORDEN_ESTADOS: readonly EstadoVisual[] = [
  'obligatorio',
  'obligatorio_pendiente_reglamento',
  'recomendado',
  'sin_datos',
  'no_aplica',
  'cumplido',
];

/** Chips de ambito: discretos, solo borde y texto. */
export const AMBITOS: Record<Ambito, string> = {
  estatal: 'text-ambito-estatal border-ambito-estatal',
  autonomico: 'text-ambito-autonomico border-ambito-autonomico',
  provincial: 'text-ambito-provincial border-ambito-provincial',
  municipal: 'text-ambito-municipal border-ambito-municipal',
};
