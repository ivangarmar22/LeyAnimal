# Ideas aparcadas

Cosas que no entran en el alcance actual. No se implementan sin decisión
explícita.

---

## Decidido dejar fuera

### Página pública «me he perdido» con QR

Página mínima por animal, opcional y desactivable, accesible por un QR
imprimible para la chapa, que muestra solo los datos de contacto que el dueño
decida exponer.

**Por qué queda fuera**: es superficie pública con datos de contacto de personas
reales. Necesita moderación, limitación de peticiones y defensa frente a abuso,
y eso se comería buena parte del esfuerzo de la fase 9 restándoselo al núcleo
del producto (motor de reglas y SEO local).

**Si se retoma**: privacidad por defecto, nada visible salvo lo que el usuario
active explícitamente, y capacidad de desactivar la página al instante.

---

## Sin evaluar todavía

- **Directorio de colonias felinas y programas CES por municipio.**
- **Comparador de tasas del censo canino** entre ayuntamientos.
- **Buscador de núcleos zoológicos** registrados.
- **Guía de viaje con animales**: transporte público por ciudad, playas caninas,
  pasaporte europeo.
- **Modo veterinario o protectora**, multi-cliente.
- **Alertas por publicación en boletines autonómicos**, vigilando cada boletín.

---

## V2: todo lo relativo a usuarios

Decidido fuera de la V1 (DECISIONES.md, D39). Necesitará backend (base de
datos y autenticación); cuando se diseñe se decidirá cuál (D49).

- Autenticación (enlace mágico y Google) y área privada: animales guardados,
  checklist marcable, documentos y recordatorios.
- Avisos por email: cambios normativos de tu territorio, vencimientos,
  resumen mensual, con doble opt-in y baja en un clic.
- Panel de administración: normas, reglas con previsualización, cambios
  normativos, reportes de usuarios, auditoría.
- Enlace compartible con token opaco (en la V1 se comparte la URL de la
  consulta, sin el nombre del animal).
- `/colabora` guardando reportes en base de datos en lugar de abrir el correo.

## Extras del brief pendientes

- **Widget embebible** para webs de veterinarios y protectoras.
- **«Usar mi ubicación»** en el paso 2 de la consulta: necesita coordenadas de
  los municipios, que el listado del INE no trae. Habría que añadir una fuente
  oficial (por ejemplo, el nomenclátor del IGN). Como el sitio es estático, el
  cálculo del municipio más cercano se haría en el navegador.
- **Listas autonómicas de razas potencialmente peligrosas**: el modelo ya lo
  soporta (`razas_ppp_autonomicas`); falta verificar cada comunidad.
- **Anexo II del RD 287/2002** (características de los perros potencialmente
  peligrosos) como cita en el verificador.

## Mejoras técnicas detectadas en la auditoría

- **Orden del buscador por población**: al escribir «alcala» sale primero
  Alcalalí y no Alcalá de Henares, porque el índice no lleva población. Añadir
  la población del padrón del INE al exportador permitiría desempatar.
- **Sprite de iconos**: casi un tercio del HTML de cada ficha son iconos SVG en
  línea. Un sprite reduciría el tamaño publicado (unos 1,1 GB) si el
  alojamiento lo pidiera.
