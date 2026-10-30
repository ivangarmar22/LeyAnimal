# Ideas aparcadas

Cosas que no entran en el alcance actual. No se implementan sin decisión
explícita.

---

## Decidido dejar fuera

### Todo lo relativo a usuarios (la antigua V2)

Decisión del propietario (28/09/2026, DECISIONES.md, D50): LeyAnimal es una web
informativa, **sin login ni base de datos**. Quedan fuera:

- Autenticación y área privada: animales guardados, checklist marcable,
  documentos y recordatorios.
- Avisos por email: cambios normativos de tu territorio, vencimientos, resumen
  mensual.
- Panel de administración: el contenido se edita en los JSON de `src/datos/`
  y se revisa en el diff.
- Enlace compartible con token opaco: se comparte la URL de la consulta, sin
  el nombre del animal.
- `/colabora` guardando reportes: abre el programa de correo con el mensaje
  preparado.

Para avisar de cambios sin cuentas ya está el RSS de `/cambios`.

### Página pública «me he perdido» con QR

Página mínima por animal, opcional y desactivable, accesible por un QR
imprimible para la chapa, que muestra solo los datos de contacto que el dueño
decida exponer.

**Por qué queda fuera**: es superficie pública con datos de contacto de
personas reales, y necesitaría base de datos, moderación y defensa frente a
abuso.

---

## Sin evaluar todavía

- **Directorio de colonias felinas y programas CES por municipio.**
- **Comparador de tasas del censo canino** entre ayuntamientos.
- **Buscador de núcleos zoológicos** registrados.
- **Guía de viaje con animales, segunda parte**: las guías «Viajar por España»
  y «Viajar al extranjero» ya cubren transporte, alojamiento, pasaporte y
  vacunas (D51). Faltan las normas de transporte público de cada ciudad y las
  playas caninas por municipio.
- **Procedimiento de reconocimiento de perros de asistencia** de cada
  comunidad: la guía ya enlaza la ley de cada una (D58); faltaría el trámite.
- **Vacuna antirrábica en todas las comunidades**: hoy se cita donde la
  impone la ley o el reglamento de la ciudad; en el resto la fijan decretos y
  órdenes autonómicas que habría que cargar en `externas.json`.
- **Ordenanzas de las grandes ciudades** (censo, tasas, zonas para perros),
  como ya se hace con Ceuta y Melilla.
- **Modo veterinario o protectora**, multi-cliente.
- **Alertas por publicación en boletines autonómicos**, vigilando cada boletín.

## Extras pendientes

- **Widget embebible** para webs de veterinarios y protectoras.
- **«Usar mi ubicación»** en el paso 2 de la consulta: necesita coordenadas de
  los municipios, que el listado del INE no trae. Habría que añadir una fuente
  oficial (por ejemplo, el nomenclátor del IGN). Como el sitio es estático, el
  cálculo del municipio más cercano se haría en el navegador.
- **Listas autonómicas de razas potencialmente peligrosas**: el modelo ya lo
  soporta (`razas_ppp_autonomicas`); falta verificar cada comunidad.
- **Anexo II del RD 287/2002** (características de los perros potencialmente
  peligrosos) como cita en el verificador.

## Mejoras técnicas detectadas en las auditorías

- **Orden de la búsqueda de municipio por población**: al escribir «alcala» sale primero
  Alcalalí y no Alcalá de Henares, porque el índice no lleva población. Añadir
  la población del padrón del INE al exportador permitiría desempatar.
- **Sprite de iconos**: casi un tercio del HTML de cada ficha son iconos SVG en
  línea. Un sprite reduciría el tamaño publicado (unos 1,1 GB) si el
  alojamiento lo pidiera.
