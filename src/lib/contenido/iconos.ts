import {
  avion,
  aviso,
  biberon,
  birrete,
  calendario,
  camion,
  carne,
  casa,
  casaJardin,
  casas,
  coche,
  escudo,
  estetoscopio,
  florMarchita,
  gatoEntero,
  huellas,
  hueso,
  lagarto,
  manosCorazon,
  paseante,
  perroGuia,
  perroServicio,
  playa,
  siluetas,
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
  'solo-en-casa': casa,
  paseos: paseante,
  cria: biberon,
  especies: lagarto,
  educacion: hueso,
  'gatos-comunitarios': gatoEntero,
  vecinos: casas,
  familia: siluetas,
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
  vacaciones: playa,
  'no-puedo-cuidarlo': casaJardin,
  'final-de-vida': florMarchita,
  camada: biberon,
  separacion: siluetas,
  vecinos: casas,
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
