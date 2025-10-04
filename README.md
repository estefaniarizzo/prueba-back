# prueba-back

Pequeña API y utilidades para calcular fechas hábiles según la "Prueba técnica: fechas hábiles".

Características
- Cálculos con conciencia de zona horaria (America/Bogota - Colombia).
- Jornada laboral: 08:00–17:00 (hora local) con pausa de almuerzo 12:00–13:00.
- Soporta sumar días hábiles y horas hábiles (se suman primero los días y luego las horas).
- Tiene en cuenta fines de semana y festivos nacionales (en ejecución normal se obtienen desde un JSON remoto).
- Tests deterministas: en las pruebas se puede inyectar un conjunto de festivos fijo.

Inicio rápido

1. Instalar dependencias

```powershell
npm install
```

2. Ejecutar tests

```powershell
npm test
```

3. Ejecutar en desarrollo

```powershell
npm run dev
```

API

GET /business-days

Parámetros de consulta
- `date` (requerido): marca de tiempo ISO 8601 en UTC (debe terminar con `Z`). Ejemplo: `2025-04-10T15:00:00.000Z`.
- `days` (opcional): entero no negativo de días hábiles a sumar (por defecto 0).
- `hours` (opcional): entero no negativo de horas hábiles a sumar (por defecto 0).

Resumen del comportamiento
- Los cálculos se realizan en la zona `America/Bogota`. El resultado final se devuelve en UTC como cadena ISO terminada en `Z`.
- Se suman primero los días (saltando fines de semana y festivos), y después las horas respetando la jornada y la pausa de almuerzo.
- En caso de error la API responde JSON con la forma `{ "error": "invalid_request", "message": "..." }` y un código HTTP apropiado.

Ejemplo de uso

```powershell
curl "http://localhost:3000/business-days?date=2025-04-10T15:00:00.000Z&days=5&hours=4"
```

Respuesta ejemplo:

```json
{ "date": "2025-04-21T20:00:00Z" }
```

Notas para desarrolladores
- En ejecución normal la lista de festivos se descarga desde un recurso remoto. Para pruebas deterministas los tests inyectan un conjunto de festivos usando las funciones de `src/dateUtils.ts`.
- Si cambias las reglas de negocio, añade/actualiza tests en la carpeta `tests/`.

