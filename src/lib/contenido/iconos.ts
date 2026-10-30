import {
  avion,
  aviso,
  birrete,
  calendario,
  camion,
  carne,
  coche,
  escudo,
  estetoscopio,
  huellas,
  manosCorazon,
  perroGuia,
  perroServicio,
  sirena,
  tirita,
  type IconoColor,
} from './ilustraciones';

/** Icono a color de cada tema, por su clave. */
export const ICONOS_TEMA: Record<string, IconoColor> = {
  seguro: escudo,
  identificacion: carne,
  curso: birrete,
  ppp: aviso,
  esterilizacion: estetoscopio,
};

/** Icono de cada guia por situacion y de los accesos de su indice. */
export const ICONOS_SITUACION: Record<string, IconoColor> = {
  'comprar-o-adoptar': manosCorazon,
  mudanza: camion,
  'viajar-por-espana': coche,
  'viajar-al-extranjero': avion,
  'perro-de-asistencia': perroServicio,
  ppp: aviso,
  incidencia: sirena,
};

/** Icono de cada obligacion propia de una comunidad (referencias, D56). */
export const ICONOS_DESTACADO: Record<string, IconoColor> = {
  vacunacion: tirita,
  esterilizacion: estetoscopio,
  formacion: birrete,
  maximoAnimales: huellas,
  tiempoSolo: calendario,
  correa: perroGuia,
};
