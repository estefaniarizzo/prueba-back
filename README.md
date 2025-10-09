# Prueba técnica — Fechas hábiles (API)

Repositorio con la solución en TypeScript para la prueba técnica: calcular fechas/hora hábiles en Colombia.

El objetivo de esta solución es proporcionar una API REST que, a partir de una fecha inicial (o la hora actual en Colombia), sume días y/o horas hábiles respetando: jornada 08:00–17:00 (pausa 12:00–13:00), fines de semana y festivos nacionales.

## Resumen técnico
- Lenguaje: TypeScript (tipado explícito en funciones públicas y estructuras principales).
- Fecha y zona horaria: Luxon (zona `America/Bogota` para cálculo, salida en UTC ISO con `Z`).
- Server: Express (para desarrollo) + funciones serverless en `api/` (compatibilidad Vercel/Render).
- Festivos: por defecto se obtienen de https://content.capta.co/Recruitment/WorkingDays.json. Tests usan inyección para determinismo.

## Requisitos
- Node.js 18+ (recomendado).
- npm 8+.

## Instalación
```powershell
git clone https://github.com/estefaniarizzo/prueba-back
cd prueba-back
npm ci
```

## Scripts útiles
- `npm run dev` — arranca servidor en desarrollo (ts-node-dev) en http://localhost:3000
- `npm run build` — compila TypeScript a `dist/`
- `npm run start` — arranca la versión compilada (node ./dist/src/index.js)
- `npm test` — ejecuta tests (Jest + ts-jest)

## Contrato de la API
- Método: GET
- Ruta pública (despliegue): `/api/business-days` (también disponible `/business-days`)
- Query parameters:
	- `date` (opcional): ISO 8601 en UTC con sufijo `Z`. Si se provee, se convierte a `America/Bogota` y se usa como inicio del cálculo. Ej: `2025-04-10T15:00:00.000Z`.
	- `days` (opcional): entero no negativo, días hábiles a sumar.
	- `hours` (opcional): entero no negativo, horas hábiles a sumar.
- Reglas:
	- Si no se proporciona `date`, el cálculo inicia desde la hora actual en Colombia.
	- Si no se provee `days` ni `hours`, la API devuelve error (400).
	- Si se proporcionan ambos, se suman primero los días y luego las horas.

### Respuesta exitosa (200 OK)
- Content-Type: `application/json`
- Body EXACTO:
```json
{ "date": "2025-08-01T14:00:00Z" }
```
(la clave es obligatoria `date` y debe ser una cadena ISO UTC terminada en `Z`, sin milisegundos)

### Respuestas de error
- Validación (400 Bad Request):
```json
{ "error": "InvalidParameters", "message": "Detalle del error" }
```
- Error interno (500):
```json
{ "error": "InternalError", "message": "Detalle técnico" }
```

## Ejemplos (curl / PowerShell)
- Obtener resultado (ejemplo explícito):
```bash
curl -i "https://TU_DESPLIEGUE/api/business-days?date=2025-04-10T15:00:00.000Z&days=5&hours=4"
```
PowerShell:
```powershell
Invoke-WebRequest -Uri "https://TU_DESPLIEGUE/api/business-days?date=2025-04-10T15:00:00.000Z&days=5&hours=4" -UseBasicParsing
```
- Petición sin parámetros (esperado 400):
```bash
curl -i "https://TU_DESPLIEGUE/api/business-days"
```

## Comportamiento y reglas de negocio (detallado)
- Zona: todos los cálculos internos se hacen en `America/Bogota`.
- Horario laboral: 08:00–12:00 (mañana), 13:00–17:00 (tarde). Almuerzo 12:00–13:00.
- Si la fecha inicial está fuera de horario laboral o en un día no laboral, se ajusta hacia atrás al momento laboral más cercano (si está antes de 08:00 se retrocede al día laboral anterior a las 17:00; si está en almuerzo se aproxima a 12:00; si está después de 17:00 se ajusta a 17:00 del día laboral).
- Días hábiles: lunes a viernes excluyendo festivos (lista remota por defecto).
- Festivos: la aplicación usa una caché en memoria; los tests pueden inyectar un conjunto fijo mediante las funciones `setHolidaysCache()` y `clearHolidaysCache()` para determinismo.

## Notas de despliegue
- Vercel: `vercel.json` contiene `builds` para compilar las funciones `api/**/*.ts` con `@vercel/node` y rewrites para la raíz.
- Render: configurar Build Command como:
```
npm ci --production=false && npm run build
```
Start Command:
```
npm run start
```
Esto asegura que `devDependencies` (tipos) se instalen para la compilación.

## Tests
- Ejecutar:
```powershell
npm test
```
- Los tests incluyen los 9 ejemplos oficiales y utilidades para inyectar festivos y limpiar la caché.

## Calidad y consideraciones
- Tipado: las funciones públicas tienen anotaciones de tipo explícitas (ej. `calculateBusinessDate(start: DateTime, days: number, hours: number): Promise<DateTime>`).
- Resiliencia: la descarga de festivos tiene timeout y comportamiento seguro (si falla se continúa con un conjunto vacío)
- Performance: la lógica es determinista y usa operaciones de fecha básicas; la caché evita llamadas remotas repetidas.

## URL pública
- Despliegue actual: https://prueba-back-0slg.onrender.com


