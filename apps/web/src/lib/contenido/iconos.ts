import {
  GraduationCap,
  ScanLine,
  Scissors,
  Shield,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-preact';

/** Icono de cada tema, por su clave. */
export const ICONOS_TEMA: Record<string, LucideIcon> = {
  seguro: Shield,
  identificacion: ScanLine,
  curso: GraduationCap,
  ppp: ShieldAlert,
  esterilizacion: Scissors,
};
