# Decisiones TP1

## Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera

### Por qué no pudo resolverlo solo:

Git fusiona cambios de forma automática cuando afectan distintas partes de un archivo. Usa un algoritmo de merge de 3 vías: compara el commit base común (el ancestro de donde salieron las dos ramas) contra las puntas de ambas ramas.
Cuando los cambios tocan distintas partes de un archivo, Git los combina automáticamente. Pero en este caso, ambas ramas modificaron exactamente la misma línea (la línea 1 del README.md) y con textos diferentes. Como Git no sabe cuál versión es la que realmente tiene que quedar, frena el merge, marca el archivo con los delimitadores de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`) y le deja la decisión a la persona para que elija el contenido final.

### Qué tendría que haber pasado para que nunca apareciera:

Para que no ocurriera conflicto, cada rama debería haber editado lineas diferentes o archivos distintos o que antes de crear los cambios en la rama B se hubiera hecho un pull para incorporar los cambios ya mergeados de la rama A.
Tambien deberia existir una comunicacion si son dos miembros de un equipo para que sepan cuando alguien mergea a main.


## Qué problemas encontraste y cómo los solucionaste

No encontré problemas muy grandes. La guía estaba clara. La única duda inicial fue la sintaxis de Markdown para enlazar imágenes locales, pero se resolvió rápido consultando a la IA.

## Declaración de uso de IA

Como dije en el punto anterior utilicé asistencia de IA (Gemini) para consultar la sintaxis correcta de rutas relativas de imágenes en Markdown para armar el archivo evidencias.md.
Para verificarlo comprobé en el navegador y en el editor que las imágenes renderizaran correctamente.


# Decisiones TP2

## Qué app elegiste y por qué (contra los criterios de la guía).
Elegi hacer una aplicación web propia para gestionar reservas de canchas de fútbol. Permite a clientes ver disponibilidad en un calendario y crear reservas; los administradores gestionan canchas(alta, baja y modificacion), confirman/cancelan turnos y monitorean ingresos del mes.

La app quizas tiene algunas vistas mas de las que pide la consigna pero no agrega demasiada dificultad extra. 
Cuenta con una arquitectura de tres capas (backend con API REST en Go, frontend SPA en React con Vite y base de datos relacional PostgreSQL). La hice en go que es un lenguaje que medianamente domino y react el frontend.

Además, corre y compila de forma 100% local sin depender de servicios externos en la nube, y cuenta con tests unitarios en Go para validar la lógica de turnos, lo que me va a servir para el TP5. Si bien el panel de administración agrega alguna pantalla extra, el alcance sigue siendo acotado y manejable, y al estar hecha en Go —un lenguaje que comprendo— puedo mantenerla y modificarla sin problemas para la defensa del integrador.

No es una app compartida, generé un plan y la IA la generó para mi.

## Decisiones de contenerización: imágenes base elegidas, estructura multi-stage, qué persiste y qué no.

### Imágenes base elegidas
| Componente | Imagen de build | Imagen final | Razón |
|---|---|---|---|
| Backend | `golang:1.25-alpine` | `alpine:latest` | El compilador de Go no hace falta en runtime. El binario es estático (`CGO_ENABLED=0`), solo necesita ca-certificates y tzdata |
| Frontend | `node:20-alpine` | `nginx:alpine` | Node y Vite no hacen falta en runtime. nginx sirve los estáticos y hace de proxy inverso para `/api/` |
| Base de datos | — | `postgres:15-alpine` | Versión que usa el proyecto. Alpine por el peso mínimo |

Para el backend utilicé `golang:1.25-alpine` como imagen de compilación y `alpine:latest` para la imagen final. El compilador y las herramientas de Go solo hacen falta durante el build, por lo que compilar el binario de forma estática (`CGO_ENABLED=0`) me permitió descartar todo el SDK y dejar una imagen de runtime de apenas ~40 MB, instalando únicamente `ca-certificates` y `tzdata` para el manejo de certificados y zonas horarias. En el frontend apliqué el mismo criterio: usé `node:20-alpine` para instalar dependencias y generar el build con Vite, y luego pasé los archivos estáticos a `nginx:alpine`. Nginx no solo sirve la SPA, sino que actúa como proxy inverso redirigiendo las peticiones relativas de `/api/` hacia el servicio `http://backend:8080`, lo que evita problemas de CORS y permite que la imagen sea portable a cualquier entorno.

### Estructura multi-stage y persistence

**¿Por qué multi-stage?**
Sin multi-stage, la imagen final del backend incluiría el SDK completo de Go (~300 MB). Con multi-stage, la imagen final pesa ~45 MB y solo contiene el binario compilado. Lo mismo para el frontend: sin multi-stage, viajarían Node, Vite y `node_modules`. con multi-stage, solo viajan los HTML/JS/CSS del `dist/`.

**Orden de instrucciones para aprovechar el cache:**
Las instrucciones del Dockerfile se ordenaron de lo que cambia con menos frecuencia a lo que cambia más seguido, ya que cuando una capa se modifica, Docker invalida esa y todas las que vienen después. Por eso, primero se copian únicamente los manifiestos de dependencias (`go.mod`/`go.sum` y `package*.json`) y se ejecutan las descargas (`go mod download` y `npm ci`). Recién después se copia el resto del código fuente (`COPY . .`) y se compila. Así, cuando tocamos una línea de código, Docker no vuelve a descargar paquetes externos y reutiliza la caché, haciendo los builds casi instantáneos.

**Que persiste**
En el docker compose definimos los volumes para que persistan los datos de la base de datos, de manera que si se reinicia el contenedor los datos no se pierdan.

En este caso hay un volumen que se llama `pgdata` que es el que persiste los datos de la base de datos dentro del contenedor de PostgreSQL. De esta manera, las canchas y reservas registradas sobreviven a reinicios del servicio y a un `docker compose down` tradicional. Solo se limpian cuando se ejecuta explícitamente `docker compose down -v`. Además, agregué un `healthcheck` con `pg_isready` en el servicio de la base de datos para que el backend espere a que Postgres esté realmente listo antes de arrancar.

## Problemas encontrados y cómo los resolviste.
Tuve algunas complicaciones sobre todo con el uso de comandos para go que eran distintos a los de la consigna que estaban para .net. 
Tuve que seguir el video porque la guia se me hizo dificil de seguir.
Me costo subir las imagenes al registro, generar el token, ponerlo en la terminal y pushear con el comando correcto. Pero lo resolvi consultandolo con la IA.

## Declaración de uso de IA

Utilice la IA para que me de los comandos correctos que deberia utilizar. Ademas, iba autocompletando con lo que me sugeria chequeando a la vez el ejemplo de la guia.

La app la hizo completamente la IA, yo le di indicaciones previas de lo que queria que haga, defini algunos ADRs y condiciones necesarias de cumplimiento y caracteristicas y el generó todo. Luego yo fui haciendo pruebas para asegurarme de que todo funcione correctamente.

Todas las decisiones tomadas y la estructura de la app se pueden encontrar en el README.md: [Decisiones Arquitectónicas en README.md](README.md#7-decisiones-arquitectónicas)

# Decisiones TP3

## Duración del sprint.
El sprint que elegí es de una duración de una semana. La idea es poder seguir el cronograma de la materia y realizar un tp por semana. Si me estiro más allá de una semana probablemente no llegue con el tiempo para la entrega final del proyecto.
Trabajar con sprints cortos en un desarrollo individual reduce la incertidumbre, obliga a planificar incrementos de valor pequeños y proporciona retroalimentación rápida cada semana, evitando retrasos o acumulaciones de trabajo.

## Número del límite de trabajo en progreso
Como bien sugiere el video y la guía, elegí 2 tareas como límite de la columna In Progress para evitar el hecho de hacer demasiadas cosas al mismo tiempo y que nada se termine, estancando el progreso. El video sugiere n trabajadores +1. Al ser individual 1+1. 

La meta es sostener el principio de Kanban de empezar menos y terminar más, evitando el costo cognitivo de la multitarea y el inventario de código a medio hacer. El cupo extra (+1) funciona como una válvula operativa por si una tarea queda momentáneamente frenada y necesito avanzar en otra sin romper el flujo de trabajo.

## Diagnóstico de la historia mal escrita: por qué está mal escrita y cómo la reescribirías.
No aporta valor de negocio ni está enfocada en el usuario final. Es una tarea técnica. Además, el rol Como desarrollador es incorrecto porque el desarrollador es quien implementa la solución, no el beneficiario del valor, mientras que "crear la tabla para guardar datos" es un detalle de implementación y no una necesidad del cliente

Como usuario registrado, quiero poder actualizar mis datos de perfil para mantener mi información de contacto al día. 
(Criterio de aceptación: los cambios modificados en el formulario se guardan correctamente en la base de datos y se reflejan al recargar la vista).

## Problemas encontrados y cómo los resolviste.
No encontre grandes problemas en la realización de este trabajo. El único paso a verificar fue la versión de GitHub CLI para confirmar si podía vincular sub-issues con --add-sub-issue desde la terminal o si debía hacerlo por la web. No pude desde ubuntu descargar la version mas reciente por lo que lo hice desde la web.

## Declaración de uso de IA
No utilice IA en este trabajo. Únicamente consulté a la IA (Gemini) para revisar la redacción y síntesis de este archivo `decisiones.md`, verificando personalmente que cada justificación reflejara exactamente las decisiones tomadas en el repositorio.


# Decisiones TP4

## Estructura elegida del pipeline (¿por qué esos jobs? ¿por qué en paralelo?).
El pipeline divide la ejecución en los jobs build-backend y build-frontend para aislar los entornos según la arquitectura desacoplada de la app (un backend en Go y un frontend en React/Vite). Al correr en paralelo sobre runners limpios, se optimiza el tiempo de feedback reduciendo la duración total al tiempo del job más pesado. Esta separación responde a la arquitectura desacoplada del proyecto, los cuales no comparten código ni necesitan de los artefactos del otro para construirse.

En GitHub Actions cada job se ejecuta en un runner limpio y efímero (`ubuntu-latest`) con su propio sistema de archivos aislado. Al no haber dependencias secuenciales entre ellos, corren en paralelo por defecto. Esto optimiza notablemente el ciclo de feedback en los Pull Requests, ya que la duración total de la verificación equivale únicamente al tiempo del job más pesado y no a la suma de ambos.

## Qué cachea tu pipeline (capas: cuáles se reutilizan y cuáles no) y qué pasa si el cache desaparece.
A través del paso `docker/setup-buildx-action`, se habilita el constructor BuildKit de Docker para exportar e importar las capas de las imágenes directamente hacia el almacén de GitHub Actions utilizando `cache-from` y `cache-to` con `type=gha,mode=max`. Para evitar que un job sobreescriba el almacenamiento del otro en cada corrida, se configuró un estante separado mediante `scope=backend` y `scope=frontend`

Gracias al orden de instrucciones definido en los Dockerfiles, las capas tempranas que descargan dependencias externas (`go.mod`/`go.sum` con `go mod download`, y `package*.json` con `npm ci`) se reutilizan marcándose como `CACHED` siempre que dichos manifiestos no sufran cambios. En cambio, las capas posteriores donde se copia el código fuente (`COPY . .`) y se genera la compilación se invalidan y se reconstruyen en cada commit.

Si GitHub Actions borra el almacén de caché (por superar el límite de cuota o por inactividad), el pipeline funciona exactamente igual: descarga las dependencias y compila todo de cero sin fallar, simplemente tardando unos segundos más. El caché es solo una optimización de velocidad y el pipeline no depende de él para completar el build con éxito.

## Por qué el pipeline construye con tu Dockerfile en vez de compilar por su cuenta.

Construir las imágenes a través de los Dockerfiles asegura la paridad absoluta entre los entornos de desarrollo local, integración continua y los futuros despliegues. Si el pipeline compilara nativamente sobre la máquina virtual ejecutando comandos de Go o Node directamente, tendríamos dos recetas de build paralelas que con el tiempo divergen, arriesgándonos a que el código compile en el runner pero falle al empaquetarse en el contenedor. 

Además, utilizar Dockerfile convierte al workflow en un proceso desacoplado y agnóstico al stack tecnológico: el runner no necesita tener preinstalados SDKs específicos ni lidiar con versiones del sistema operativo host, encargándose únicamente de orquestar la construcción del mismo contenedor inmutable que viajará hacia producción.

## Problemas encontrados y cómo los resolviste.
Tuve algunos problemas cuando hacia push de los commits porque la ruta la habia definido mal y porque me olvide de ponerle el constructor para la cache al backend entonces el job del backend tiraba error. Me di cuenta viendo los logs de actions en donde claramente te decia cual era el problema.

## Declaración de uso de IA.
No use ia para este tp. Solo me ayude de la ia para escribir mejor mis ideas en este archivo de decisiones.md.


# Decisiones TP5

## Qué lógica elegiste testear y por qué ESA (¿dónde duele un bug en tu app?)

Elegí testear la capa de **servicio** en dos paquetes con lógica de negocio propia: `internal/bookings/service.go` y `internal/courts/service.go`.

**`bookings/service.go`** es el núcleo de la app: decide si una reserva puede crearse, si una transición de estado es válida y si un usuario tiene permiso para cancelar. Un bug ahí tiene consecuencias directas:
- Si falla la validación de horarios (RN#2), un cliente puede reservar a las 2 AM.
- Si falla el control de solapamiento (RN#1), dos equipos quedan en la misma cancha al mismo horario.
- Si falla la máquina de estados (RN#4), un turno cancelado podría "resucitar" como confirmado.
- Si falla la autorización (RN#5), cualquier usuario puede cancelar la reserva de otro.

**`courts/service.go`** tiene lógica propia en `Update`: busca la cancha por ID y falla con un error claro si no existe. Si esa rama no está testeada y se rompe, el admin recibe un panic o un mensaje de error críptico en lugar de un 404 controlado.

Los otros servicios (`users`, `settings`, `dashboard`) son delegación pura al repositorio — no tienen ramas de decisión propias, y testearlos sería verificar que Go llama una función, no que una regla de negocio funciona.

Los handlers HTTP y repositorios no se testearon: los handlers son cableado fino (parsear JSON y llamar al servicio), y los repositorios hablan con PostgreSQL — ambos requieren infraestructura real y pertenecen a la categoría de tests de integración.

En el **frontend** se testean `Login.tsx` y `BookingCalendar.tsx` por las mismas razones de impacto en el usuario final.

## Tu umbral de coverage: el número, sobre qué métrica (línea, rama o las dos) y por qué ése — y el número de rama que te da hoy, lo hayas usado o no como umbral.

Elegí un **umbral del 80%** como política de calidad en el pipeline de Integración Continua (CI):
- **Backend (Go):** Umbral del **80% sobre statements** (sentencias ejecutables), focalizado en la capa de servicios con lógica de negocio (`internal/bookings/service.go` e `internal/courts/service.go`).
- **Frontend (Vitest):** Umbral del **80% sobre branches y líneas** (así como statements y funciones) en los componentes de interfaz interactivos (`Login.tsx` y `BookingCalendar.tsx`).

### Por qué el 80% es un buen número (justificación desde la ingeniería de software):

1. **Punto de equilibrio óptimo y Ley de Rendimientos Decrecientes (Principio de Pareto 80/20):**
   El 80% es el estándar de referencia en la industria de software porque representa el balance óptimo entre mitigación de riesgos y costo de mantenimiento. Cubrir el 80% garantiza que el núcleo de la lógica de dominio (reglas de negocio, validaciones de entrada, control de solapamiento, máquinas de estado y autorización) esté completamente custodiado contra regresiones. Exigir valores cercanos al 100% genera rendimientos decrecientes exponenciales: el esfuerzo técnico requerido para cubrir el 15-20% restante (constructores triviales, métodos pasamanos de delegación pura, ramas de pánico de runtime prácticamente inalcanzables) no aporta un valor proporcional al negocio y suele inducir a la **fatiga de testing** (*test fatigue*), produciendo tests excesivamente acoplados a detalles de implementación que resultan frágiles ante cualquier refactorización.

2. **Por qué no un umbral inferior (ej. 50% o 60%):**
   Un piso del 50% o 60% brinda una falsa sensación de seguridad (*security theatre*). Con una exigencia tan baja, un desarrollador podría introducir una funcionalidad completa con múltiples ramas condicionales complejas sin escribir un solo test y el pipeline continuaría pasando en verde. El 80% funciona como un **Quality Gate estricto y efectivo**: cualquier nueva lógica sustancial que se incorpore sin su respectiva batería de pruebas arrastra la cobertura hacia abajo y bloquea el merge en CI de forma inmediata, forzando una disciplina de desarrollo con tests continuos.

3. **Pragmatismo frente al código sin lógica propia:**
   El margen del 20% no testeado no es negligencia, sino una decisión deliberada de diseño: permite absorber funciones que son mera delegación hacia repositorios o clientes externos (`GetAll`, `GetMyFuture`, etc.), las cuales no tienen bifurcaciones lógicas y cuyo comportamiento corresponde validarse mediante pruebas de integración sobre base de datos real, no con mocks en pruebas unitarias.

### Sobre la métrica de ramas (Branch Coverage):

- **En Go (Backend):** La herramienta nativa `go test -cover` solo reporta cobertura de *statements* (sentencias/bloques básicos), careciendo de soporte directo para *branches* sin recurrir a instrumentación experimental externa. Sin embargo, esta limitación de la herramienta se mitiga a nivel de diseño: se utilizan **Table-Driven Tests** estructurados para ejercitar matrices completas de entradas (casos válidos, casos límite, combinaciones no autorizadas y fallos inyectados en dependencias). De esta manera, aunque el reporte numérico compute statements, todas las ramas condicionales del flujo quedan efectivamente validadas.
- **En Frontend (Vitest):** `@vitest/coverage-v8` sí soporta y mide branch coverage nativamente. En el frontend se configuró explícitamente el umbral en **80% de branches** (además de líneas) debido a que los fallos más habituales en una interfaz residen en el renderizado condicional: deshabilitación de botones ante datos inválidos, carteles de error ante respuestas fallidas del backend, y manejo de estados vacíos. Exigir el 80% en branches asegura que la experiencia del usuario esté cubierta en todos sus estados posibles.

## Qué dejaste afuera de la cuenta de cobertura, backend y frontend, y por qué cada cosa (§2.4)

### Backend (Go)

El umbral se aplica sobre `./internal/bookings` y `./internal/courts` con `go test -coverprofile=coverage.out ./internal/bookings ./internal/courts`. Dentro del `coverage.out` resultante se filtran solo las líneas de `service.go` de cada paquete para el cálculo del gate.

Quedaron afuera:
- **`cmd/server/main.go`**: es el arranque (cablea el router, conecta la BD, llama a `http.Listen`). No hay reglas de negocio ahí; si está mal, la app no levanta y te enterás inmediatamente.
- **`internal/bookings/handler.go` y `internal/courts/handler.go`**: cableado HTTP fino — parsean JSON, llaman al servicio y escriben la respuesta. Testearlos requiere un HTTP server real: test de integración, no unitario.
- **`internal/bookings/repository.go` y `internal/courts/repository.go`**: hablan con PostgreSQL vía GORM. Requieren base de datos real: integración.
- **`model.go` en todos los paquetes**: solo structs con tags de GORM/JSON. Sin comportamiento que verificar.
- **`internal/auth/`, `internal/dashboard/`, `internal/middleware/`, `internal/settings/`, `internal/users/`**: servicios sin lógica de negocio propia (delegación pura) o infraestructura de autenticación. El umbral no se aplica ahí porque medir un delegador sin ramas no agrega información.

Excluir eso no es trampa: es medir lo que importa. La trampa sería excluir lógica de negocio real porque no la testeé.

### Frontend (Vitest + @vitest/coverage-v8)

La cobertura se mide sobre los archivos declarados en `include` de `vite.config.ts`: `Login.tsx` y `BookingCalendar.tsx`. El umbral está configurado en **80% de líneas y 80% de branches** (extensible a statements y funciones), igualando el nivel de exigencia establecido para el backend.

Para sostener de forma sólida este umbral sin caer en tests superficiales que solo inflen métricas, las pruebas unitarias se diseñaron con `@testing-library/react` y `userEvent` simulando interacciones reales del usuario y verificando las decisiones del DOM:

- **`Login.tsx`:**
  - **Validación de estados del formulario:** Habilitación y deshabilitación reactiva del botón de ingreso según el contenido de los campos, ejercitada mediante pruebas parametrizadas (`it.each`) que prueban combinaciones vacías, parciales y completas.
  - **Flujo de autenticación exitoso:** Verificación del submit con mock de `loginApi`, confirmando el almacenamiento en el contexto global de sesión y la navegación subsiguiente.
  - **Manejo de ramas de error:** Verificación del renderizado de alertas visuales ante rechazo de credenciales y caídas inesperadas de red.
- **`BookingCalendar.tsx`:**
  - **Estados de carga y disponibilidad:** Comprobación del renderizado cuando hay canchas disponibles frente al estado de lista vacía ("No hay canchas disponibles") si la consulta no devuelve datos.
  - **Navegación temporal y selección:** Interacción con el selector de canchas, cambio de mes en el calendario y selección de fechas para disparar la consulta de turnos.
  - **Bifurcaciones de turnos (libres vs. ocupados):** Verificación de que los turnos ocupados aparezcan deshabilitados y los libres permitan interacción.
  - **Confirmación y feedback de reserva:** Validación de los campos obligatorios (nombre de equipo) para habilitar la confirmación, despacho de la reserva a la API y comprobación de los mensajes de éxito o error en pantalla.

Al abarcar sistemáticamente los caminos alternativos de la interfaz y el renderizado condicional, la suite supera holgadamente el umbral del 80% tanto en líneas como en ramas lógicas, manteniéndose robusta ante cambios cosméticos o evoluciones del código.


El resto del frontend queda afuera porque:
- **`src/api/`**: clientes HTTP puros (axios). Se mockean en los tests, no se testean directamente.
- **`src/store/AuthContext.tsx`**: contexto de React. Se mockea con `vi.mock`.
- **`src/components/`**: componentes de UI sin lógica de negocio propia (Sidebar, LoadingSpinner, etc.).
- **`src/pages/admin/`**: páginas de administración sin tests por ahora.
- **`main.tsx`**: arranque de la SPA, no tiene comportamiento testeable.

## Por qué coverage alto no garantiza calidad (con TU ejemplo)

En `service.go`, la función `GetAvailability` (línea 103) genera los slots de disponibilidad de una cancha para un día. Si escribiera este test:

```go
func TestGetAvailability_EjecucionSinAssert(t *testing.T) {
    svc := newSvc(&mockRepo{})
    svc.GetAvailability(uuid.New(), "2026-12-01")   // se ejecuta... pero no hay ningún Assert
}
```

Ese test llevaría la cobertura de `GetAvailability` del 0% al 100% en statements. El reporte quedaría verde. Pero si la función devolviera slots con horarios incorrectos, o una lista vacía cuando debería tener 14 slots, o si se rompiera el cálculo del número de slots según `SlotDurationMinutes`, **ningún test se pondría en rojo**.

Coverage mide ejecución, no verificación. El test de arriba ejecuta `GetAvailability` sin comprobar nada de lo que devuelve: sube el número y no custodia ninguna regla.

## Tu Pull Request bloqueado: qué check se puso en rojo, en qué métrica (el log lo dice), por qué, y qué escribiste para arreglarlo.

- **Qué check se puso en rojo:**
  En el pipeline de GitHub Actions, el job `build-backend` falló en el step de control de calidad `Verify backend coverage threshold` (verificación de cobertura del backend).

- **En qué métrica y qué indicó el log:**
  La métrica afectada fue el **statement coverage** del backend sobre los archivos de servicio (`service.go`). El log del pipeline en CI arrojó un código de salida `exit code 1` indicando que la cobertura total computada había caído por debajo de la valla mínima establecida del 80%.

- **Por qué falló:**
  En la rama del PR se introdujo una nueva regla de negocio en `internal/bookings/service.go`: la función `CalculateCancellationPenalty`, la cual calcula el porcentaje de penalización económica ante la cancelación de un turno en función de la anticipación horaria. Esta función sumó nuevas líneas y múltiples ramas condicionales sin contar inicialmente con tests unitarios. Como consecuencia, el volumen de código nuevo sin testear diluyó la cobertura general, activando la guardia de calidad del pipeline que frenó el merge a `main`.

- **Qué se escribió para arreglarlo:**
  Se desarrolló una suite de pruebas unitarias parametrizadas (Table-Driven Test) en `internal/bookings/service_test.go` (`TestCalculateCancellationPenalty`). El test definió una matriz de casos que cubrió exhaustivamente todas las franjas de la regla de negocio:
  1. Cancelación con más de 24 horas de antelación (penalidad 0%).
  2. Caso límite exacto en la frontera de las 24 horas (penalidad 0%).
  3. Cancelación intermedia entre 12 y 24 horas de antelación (penalidad 20%).
  4. Cancelación con aviso tardío de menos de 12 horas (penalidad 50%).
  5. Cancelación extemporánea de un turno ya transcurrido en el pasado (penalidad 100%).

  Al commitear y pushear los tests, la cobertura superó nuevamente el umbral del 80%, el step de verificación finalizó en verde con éxito (`exit code 0`) y el Pull Request quedó formalmente habilitado para mergear.

## Si refactorizaste para poder mockear: qué cambiaste y por qué no se podía testear antes

### `bookings/service.go` — sin refactor necesario

El servicio de reservas ya estaba diseñado para DI desde el TP2:
- `BookingRepository` es una **interfaz** que declara los métodos de acceso a datos. La implementación concreta `GORMBookingRepository` habla con PostgreSQL; el mock la implementa en memoria.
- `settingsGetter` es una **interfaz privada** con un único método `Get()`. El mock devuelve configuración fija.

En los tests se inyectan `mockRepo` y `mockSettings` sin tocar el código de producción.

### `courts/service.go` — refactor en este TP

`courts.Service` **antes** tenía acoplamiento concreto al repositorio:
```go
// ANTES — no testeable
type Service struct{ repo *Repository }  // *Repository concreto
func NewService(repo *Repository) *Service { ... }
```

Esto impedía reemplazar el repositorio por un mock en los tests: `*Repository` necesita una conexión real a PostgreSQL para funcionar.

**El refactor** consistió en extraer la interfaz `CourtRepository` y hacerla el contrato del servicio:
```go
// DESPUÉS — testeable
type CourtRepository interface {
    FindAll() ([]Court, error)
    FindByID(id uuid.UUID) (*Court, error)
    Create(c *Court) error
    Update(c *Court) error
    SoftDelete(id uuid.UUID) error
}
type Service struct{ repo CourtRepository }
func NewService(repo CourtRepository) *Service { ... }
```

El código de producción (`NewRepository` devuelve un `*Repository` que implementa `CourtRepository`) no cambió su comportamiento — solo el contrato se volvió explícito. En los tests se pasa `mockCourtRepo` implementado a mano, sin base de datos.

## Si tu app no tenía qué testear: qué reglas de negocio le agregaste

La app ya contaba desde el diseño inicial con un conjunto sólido de reglas de negocio en la capa de servicios (`bookings/service.go`):
- **RN#1:** Prohibición de solapamiento de turnos para la misma cancha y horario.
- **RN#2:** Validación de franjas horarias habilitadas según la configuración del complejo.
- **RN#3:** Duración fija de turnos y generación automática de slots disponibles (`GetAvailability`).
- **RN#4:** Máquina de estados finita para las reservas (`validTransition`), impidiendo transiciones inválidas (por ejemplo, pasar de cancelada a confirmada o completada).
- **RN#5:** Control de autorizaciones (un usuario cliente solo puede cancelar reservas propias).

Adicionalmente, para este trabajo práctico se incorporó una nueva regla de negocio con lógica condicional no trivial:
- **Cálculo de penalización por cancelación (`CalculateCancellationPenalty`):** Determina la retención o penalidad porcentual sobre el costo de la reserva según la anticipación con la que se cancela un turno (más de 24 hs: 0%, entre 12 y 24 hs: 20%, menos de 12 hs: 50%, turnos en el pasado: 100%). Esta regla sirvió además como el caso de estudio para el ejercicio del Pull Request bloqueado por CI.

## Si tu stack no es el de la cátedra (.NET + vitest): qué herramienta usaste para cada fila de la tabla «Tu stack, de un vistazo»

| Lo que tenés que lograr | 🐹 Go (backend) | Vitest (frontend) |
| :--- | :--- | :--- |
| **Dónde viven los tests** | Al lado del código, en archivos con el sufijo `_test.go` (mismo paquete con `_test` como sufijo del package name para tests de caja negra) | `src/tests/`, importando los componentes desde `src/pages/` |
| **Un test parametrizado** | **Table-Driven Tests**: un `slice` de structs recorrido con un `for` y `t.Run(tc.name, func(t *testing.T){...})` | `it.each([...])('nombre $campo', async ({...}) => {...})` de Vitest |
| **Que la dependencia entre desde afuera** | **Interfaz** pasada como parámetro en `NewService(repo BookingRepository, settingsRepo settingsGetter)` — Go no tiene DI automático, la inyección es manual en el constructor | Props del componente o `vi.mock()` que intercepta la importación del módulo |
| **Fabricar el doble (mock)** | Implementar la interfaz a mano (`mockRepo` y `mockSettings` como structs que implementan la interfaz) — no se necesita ningún framework | `vi.mock('../api/courts', () => ({...}))` de Vitest intercepta el módulo completo |
| **Medir la cobertura** | `go test -coverprofile=coverage.out ./internal/bookings` y `go tool cover -func=coverage.out` para el desglose | `npx vitest run --coverage` con `@vitest/coverage-v8` |
| 🔴 **Un umbral que ROMPE el build** | No es nativo. Se automatiza en el pipeline con un script: `go tool cover -func=coverage.out \| grep total \| awk '{print $3}' \| sed 's/%//'` y se compara el número contra el umbral con `bc` o Python | `coverage.thresholds` en `vite.config.ts` o `vitest.config.ts` |
| 🔴 **Qué ENTRA en la cuenta** | `go test -coverprofile=coverage.out ./internal/bookings` (solo el paquete con lógica de negocio). Con `-coverpkg=./...` se mide todo y el número se desploma drásticamente al incluir handlers, repositorios y el arranque sin tests | El `include:` en la config de coverage de Vitest filtra qué archivos entran |
| **Reporte legible del resultado** | `go tool cover -html=coverage.out -o coverage.html` genera un HTML interactivo con líneas coloreadas por cobertura | Reporte HTML generado por `@vitest/coverage-v8` en `./coverage/` |
| 🔴 **Que las herramientas de test ENTREN a la etapa de tests del Dockerfile** | El toolchain de Go ya viene incluido en la imagen oficial `FROM golang:X.X-alpine` — no requiere instalar nada extra. `go test` está disponible sin dependencias adicionales | `npm ci` (sin `--omit=dev`) para que `vitest` y `@vitest/coverage-v8` estén disponibles |

## El ejercicio del camino sin cubrir

Al abrir el reporte HTML (`go tool cover -html=coverage.out`) en `bookings/service.go`, la **línea 47** aparecía coloreada en naranja (rama parcialmente cubierta):

```go
sett, err := s.settingsRepo.Get()
if err != nil {                         // ← línea 47: rama "err != nil" no recorrida
    return nil, errors.New("no se pudo obtener la configuración")
}
```

**1. Qué línea era:** Línea 47 de `service.go` — la rama `err != nil` del `if` que maneja el fallo de `settingsRepo.Get()`.

**2. Qué entrada la recorre:** Pasar un `mockSettingsError` que devuelva error en `Get()`:

```go
type mockSettingsError struct{}
func (m *mockSettingsError) Get() (*settings.Settings, error) {
    return nil, errors.New("fallo simulado de configuración")
}
```

**3. Qué decidí:** En la iteración anterior lo dejé pendiente. En la iteración siguiente **lo agregué** como `TestCreate_SettingsRepoError` en `service_test.go`. El test pasa `mockSettingsError` como dependencia y verifica que `Create` devuelva error cuando la configuración no está disponible — cubre la rama de infraestructura que el reporte marcaba en naranja.

## Problemas encontrados y cómo los resolviste.

No estaba en la tabla Go, así que la completé mas arriba

También detecté que los tests originales de `BookingCalendar.test.tsx` tenían condicionales defensivos (`if (btn)` / `else`) que hacían que siempre pasaran independientemente del comportamiento real del componente — falsos positivos. Los reescribí para que verifiquen comportamiento concreto observable: que el nombre de la cancha devuelta por el mock aparezca como `<option>` en el `<select>`, y que cuando no hay canchas el componente muestre el mensaje "No hay canchas disponibles" y no renderice el selector.

Tuve que decidir entre **`RUN` vs `ENTRYPOINT` en la etapa de tests del Dockerfile, y por qué Docker en lugar de `setup-go` directamente:**

La cátedra usa `ENTRYPOINT` en la etapa `test` del Dockerfile de .NET:
```dockerfile
FROM build AS test
ENTRYPOINT ["dotnet", "test", "Backend.sln", "--logger", "trx;LogFileName=tests.trx", "--results-directory", "/out"]
```

En Go seguí el mismo patrón con `ENTRYPOINT` apuntando a un script [`scripts/run_tests.sh`](app/backend/scripts/run_tests.sh):
```dockerfile
FROM builder AS test
COPY scripts/run_tests.sh /run_tests.sh
RUN chmod +x /run_tests.sh
ENTRYPOINT ["/run_tests.sh"]
```

Y en el CI:
```yaml
- docker build --target test --load -t backend-test:ci .
- docker run --rm -v "$GITHUB_WORKSPACE/TestResults:/out" backend-test:ci
```

**¿Por qué `ENTRYPOINT` y no `RUN`?**
Con `RUN` los tests corren durante el `docker build` y los archivos generados quedan dentro de la capa del contenedor sin forma de extraerlos. Para sacar `coverage.html`, `coverage.out` y `test-results.txt` al runner (y poder subirlos como artifact) se necesita un volumen, y para montarlo hay que ejecutar el contenedor con `docker run` — que solo dispara el script si el contenedor tiene `ENTRYPOINT` o `CMD`.

**¿Por qué Docker y no `actions/setup-go` directo?**
Para Go, el patrón más idiomático en la industria es correr `go test` directamente en el runner con `actions/setup-go` — más simple, sin overhead de capas Docker. Sin embargo, elegí el enfoque Docker por dos razones:

1. **Consistencia con la consigna**: el patrón de la cátedra usa Docker para los tests, y seguirlo facilita la comparación y la discusión en clase.
2. **Aislamiento de entorno**: los tests corren en la misma imagen base (`golang:1.25-alpine`) que el pipeline de build. Si el runner cambia versión de Go, los tests siguen corriendo con la versión del `go.mod`, no la del runner.

La desventaja es el overhead del `docker build` + `docker run` vs. un `go test` directo. Para este proyecto el tiempo extra es aceptable.

## Declaración de uso de IA.

Utilicé IA (Antigravity/Gemini) a lo largo de todo el TP para: analizar si los tests cumplían los criterios de la consigna, reformatear los tests al patrón AAA, agregar el test parametrizado Table-Driven en Go y el `it.each` en Vitest, calcular los números de cobertura, reescribir los tests débiles de BookingCalendar, e identificar el camino sin cubrir en el reporte de coverage. Verifiqué cada cambio corriendo los tests localmente y revisando que los resultados fueran coherentes con lo que el código hace. También, fui escribiendo este archivo a medida que iba avanzando procurando entender y explicar cada paso que iba haciendo y validandolo con el video.


---

# Decisiones TP6

## Enlaces de este TP

- **Paquete backend**: `https://github.com/Gabriellaniado/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend`
- **Paquete frontend**: `https://github.com/Gabriellaniado/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend`
- **Corrida de PR (Entrar al registry salteado)**: https://github.com/Gabriellaniado/ingsoft3-tp01/actions/runs/36268080901
- **Corrida de main (publicar imagen es el último paso)**: https://github.com/Gabriellaniado/ingsoft3-tp01/actions/runs/36268136883
- **URL QA**: https://turnero-front-qa.onrender.com (API: https://turnero-api-qa.onrender.com)
- **URL PROD**: https://turnero-front-prod.onrender.com (API: https://turnero-api-prod.onrender.com)

---

## Por qué el artefacto se publica sólo con la verificación en verde

El pipeline garantiza esto encadenando tres condiciones, no una:

1. **Nada entra a `main` sin el pipeline en verde** — el branch protection del TP4 bloquea el merge si los checks fallan.
2. **Sólo lo que entra a `main` se publica** — el paso de publicar tiene `push: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}`. En un PR, `event_name` es `pull_request`, así que el paso construye pero no publica.
3. **El paso que publica es el ÚLTIMO del job** — los steps de un job corren en orden y se detienen al primer error. Si los tests fallan, el job muere ahí y el paso de publicar nunca llega a correr.

Si se publicara igual cuando los tests fallan, "estar en el registry" dejaría de significar "esto pasó la verificación" y el registry se convertiría en un depósito de imágenes rotas.

**Nota**: la garantía aplica a lo que publica el pipeline. Nada impide que alguien suba una imagen a mano con `docker push`; eso lo decide la política del equipo, no la configuración.

## Continuous Delivery vs Continuous Deployment — cuál implementé

Implementé Continuous Delivery: cada cambio verificado llega automáticamente a QA, pero el último paso hacia PROD requiere aprobación humana explícita.

No implementé Continuous Deployment (sin aprobación), el gate humano compra timing de negocio, contexto sobre qué cambia, y responsabilidad explícita (queda registrado quién aprobó).

## Diseño de la cadena (needs/if/environments) y alcance de los secrets

El workflow de CI/CD implementa una cadena de compuertas estructurada en cuatro jobs secuenciales:

```
build-backend    (sin needs)                            -> compila, corre tests y publica imagen al registry
build-frontend   (sin needs)                            -> compila, corre tests y publica imagen al registry
deploy-qa        needs: [build-backend, build-frontend] -> environment: qa (deploy automático a QA + smoke test)
                 if: solo en rama main
deploy-prod      needs: deploy-qa                       -> environment: production (pausa esperando aprobación humana + smoke test)
                 concurrency: deploy-prod
```

### Decisiones de diseño clave:

1. **Cadena con compuertas (`needs` e `if`)**:
   - `build-backend` y `build-frontend` corren en paralelo en cada push o pull request.
   - `deploy-qa` requiere que **ambos** builds hayan terminado en verde (`needs: [build-backend, build-frontend]`). Además, incluye `if: github.ref == 'refs/heads/main'`, garantizando que en un Pull Request la etapa de deploy se saltee automáticamente: los PRs solo verifican, nunca despliegan.
   - `deploy-prod` depende exclusivamente de `deploy-qa` (`needs: deploy-qa`). **No necesita repetir la condición `if` de la rama**, ya que al depender de un job que solo ejecuta en `main`, en un PR queda automáticamente cancelado/salteado por transitividad.

2. **Aislamiento y alcance de los secrets (`environments`)**:
   - Los Deploy Hooks de Render no se almacenan como Repository Secrets globales, sino como **Environment Secrets**.
   - `RENDER_HOOK_API_QA` y `RENDER_HOOK_FRONT_QA` residen en el environment `qa`. Solo los jobs con `environment: qa` tienen acceso a ellos.
   - `RENDER_HOOK_API_PROD` y `RENDER_HOOK_FRONT_PROD` residen en el environment `production`. Este entorno cuenta con la regla de protección **Required reviewers**, lo que significa que nadie (ni personas ni jobs) puede acceder a estos secretos ni disparar el hook sin una aprobación humana explícita previa.

3. **El parámetro `&ref=$GITHUB_SHA` en el Deploy Hook**:
   - Render por defecto despliega la punta de la rama si se llama al hook pelado. Usar `"$HOOK&ref=$GITHUB_SHA"` es fundamental para garantizar que Render compile y despliegue **el commit exacto que fue verificado y aprobado**, evitando condiciones de carrera donde múltiples merges seguidos provoquen que una corrida vieja promueva código más nuevo no verificado.

4. **Concurrencia (`concurrency: { group: deploy-prod, cancel-in-progress: false }`)**:
   - Evita que dos ejecuciones simultáneas hacia producción se pisen entre sí. Se configura `cancel-in-progress: false` para que las corridas no se aborten abruptamente mientras esperan revisión o ejecución.

## Qué mira el aprobador antes de aprobar (criterios del gate)

El gate humano en Continuous Delivery no es un trámite burocrático; es una compuerta de responsabilidad y criterio operativo. Antes de aprobar la promoción hacia producción, el revisor valida cuatro aspectos:

1. **Estado del entorno de QA**: Comprobar que el job `deploy-qa` haya finalizado en verde con su smoke test exitoso, y opcionalmente verificar en la URL pública de QA (`https://turnero-front-qa.onrender.com`) que la aplicación esté operativa y responda con datos reales.
2. **Naturaleza del cambio (Diff y Migraciones)**: Revisar qué código se está promoviendo. Si el commit incluye modificaciones estructurales en la base de datos (cambios de esquema, nuevas tablas), verificar que sean compatibles hacia atrás y no rompan la versión actualmente en producción.
3. **Timing y contexto operativo**: Criterio de negocio sobre el momento del deploy. Evitar promover cambios en horarios de alto tráfico, fines de semana o viernes por la tarde cuando el equipo de guardia o soporte no esté disponible para responder ante incidentes.
4. **Disponibilidad de plan de contingencia**: Saber con precisión cuál es el commit bueno inmediatamente anterior (`SHA_ANTERIOR`) para ejecutar un rollback rápido en caso de degradación del servicio tras el deploy.

## Letra chica del free tier (Render + Neon)

- **Render**: 750 horas de instancia por mes **por workspace** (los consumen los cuatro servicios: back y front en QA y PROD). Los servicios duermen tras ~15 min sin tráfico; el cold start puede tardar hasta ~1 min, por eso el smoke test usa reintentos (30 × 20 s). 500 minutos de build por mes — cada deploy reconstruye la app en Render, hasta cuatro builds por promoción completa.
- **Neon vs Postgres de Render**: Se eligió Neon porque el Postgres gratuito de Render **expira a los 30 días** de creado (con 14 días de gracia antes de ser eliminado), lo que no cubre la duración de la materia. Neon ofrece un plan gratuito permanente (0.5 GB de almacenamiento) y cómputo suspendido tras ~5 min de inactividad que se reactiva automáticamente y mucho más rápido que Render.
- **Cómo comprobé que cada entorno usa su propia base**:
  Las cadenas de conexión de Neon difieren en una sola palabra (`.../app_qa?...` contra `.../app_prod?...`). Para evitar el error silencioso de que PROD apunte a QA:
  1. Verifiqué minuciosamente en Render que la variable `DATABASE_URL` de `turnero-api-qa` contenga `/app_qa` y la de `turnero-api-prod` contenga `/app_prod`.
  2. En el SQL Editor de Neon ejecuté consultas de conteo independientes (`SELECT count(*) FROM users;`) en ambas bases de datos. Los datos creados en un entorno no se comparten ni se reflejan en el otro, garantizando el aislamiento total entre QA y Producción.

## Qué garantía perdés porque Render reconstruye desde el repo

En el §3.0 el pipeline de CI construye, prueba y publica imágenes inmutables en GitHub Packages (`ghcr.io`). Sin embargo, en el §3.2 le configuramos a Render que descargue el código fuente desde el repositorio y ejecute su propio `docker build` en cada despliegue.

**La garantía que se pierde es la inmutabilidad del artefacto verificado («se promueve lo mismo que se verificó»):**
- Lo que corre en QA y en PROD **no es la misma imagen binaria que los tests aprobaron**, sino una reconstrucción posterior del mismo código fuente.
- Aunque el commit sea idéntico, dos construcciones en momentos distintos pueden diferir: una imagen base (`golang:alpine` o `nginx:alpine`) que se actualizó con un nuevo parche, dependencias remotas con versiones flotantes, o diferencias en el runtime del constructor.
- Este compromiso se asume didácticamente en el TP6 para aprender entornos y compuertas de promoción sin complejizar la infraestructura; el **TP7** resuelve esto haciendo que Render deje de compilar y ejecute directamente las imágenes publicadas en `ghcr.io`.

## Qué prueba el smoke test y qué NO prueba

El smoke test es una verificación rápida y superficial diseñada para responder con certeza: *«¿el entorno levantó y está en condiciones mínimas de atender tráfico?»*.

### Qué prueba:
1. **Disponibilidad de la API**: Realiza un `curl` a `$URL_API/health` verificando que el proceso del backend en Go esté vivo y responda HTTP 200. En mi aplicación, como el servidor aborta con `log.Fatal` en el inicio si no logra conectarse a la base de datos PostgreSQL en Neon, que `/health` responda confirma además que la base de datos está conectada y las tablas migradas.
2. **Disponibilidad del Frontend**: Realiza un `curl` a `$URL_FRONT/` confirmando que el servidor Nginx esté activo y entregue el HTML de la Single Page Application (SPA).
3. **Resistencia a cold starts**: Emplea un bucle de hasta 30 reintentos espaciados cada 20 segundos con `--max-time 10`, tolerando los tiempos de arranque en frío típicos del free tier de Render y Neon sin generar falsos negativos.

### Qué NO prueba (y su limitación honesta):
1. **Lógica de negocio y flujos de usuario**: No prueba el flujo de login, la autenticación mediante JWT, la visualización de turnos disponibles ni la creación de reservas de canchas.
2. **Casos de borde y validaciones de datos**: No prueba solapamiento de horarios, penalizaciones por cancelación ni permisos por roles (`Admin` vs `Client`).
3. **Rendimiento bajo concurrencia**: No prueba latencia bajo carga ni fugas de conexiones hacia la base de datos.
*(Todos estos puntos son responsabilidad de la suite de tests unitarios y de integración ejecutada previamente en el CI).*
4. **Limitación honesta (no valida qué versión corre)**: El smoke test verifica que el servicio responda, pero **no garantiza qué versión exacta está corriendo**. Dado que el deploy hook responde de inmediato y Render construye en segundo plano mientras sigue sirviendo la versión previa, si el build tarda o falla, el smoke test podría dar verde contra la versión anterior. En el TP7 esto se mitiga exponiendo el commit en el `/health` para que el smoke valide que el SHA en vivo coincida con `$GITHUB_SHA`.

## Portabilidad: ¿Qué sobrevive si Render desaparece mañana?

Si Render dejara de existir, **prácticamente todo el trabajo realizado en este TP sobrevive intacto**:
- Todo el pipeline de integración continua (`build-backend`, `build-frontend`) y la suite de tests.
- Las imágenes Docker inmutables empaquetadas y versionadas en GitHub Container Registry (`ghcr.io`).
- La configuración de Nginx desacoplada mediante variables de entorno (`default.conf.template`).
- La cadena de compuertas (`needs`, `if`), la gestión de `environments` (`qa` y `production`) y el gate humano con revisión requerida en GitHub Actions.

Lo único estrictamente acoplado a Render son los dos comandos `curl` que disparan los Deploy Hooks. Migrar a otro proveedor (Railway, Fly.io, AWS o un VPS propio con Docker Compose) requeriría únicamente cambiar el mecanismo de disparo en los jobs de deploy, preservando intacta la arquitectura de Continuous Delivery.

## Deployment pattern elegido para producción real y plan de rollback

### Pattern elegido

Para un entorno de producción real, el patrón elegido es **Feature Flags** (desacoplando el *deploy* técnico del *release* de producto, apoyado en la infraestructura básica de reemplazo sin downtime que provee el host):

- **Costo (Económico)**: Es la alternativa más económica. No exige duplicar servidores ni pagar dos infraestructuras completas en paralelo como Blue-Green (que duplica el costo de cómputo durante cada pase), ni requiere balanceadores avanzados con enrutamiento ponderado de tráfico como Canary. Opera sobre la misma infraestructura ya contratada.
- **Riesgo**: Minimiza el riesgo en producción porque el código nuevo viaja "dormido" (apagado). Permite activar funcionalidades progresivamente: primero para pruebas internas de administradores, luego para un porcentaje reducido de clientes, y finalmente para la totalidad de los usuarios.
- **Rollback (Inmediato)**: Es el mecanismo de recuperación más rápido de la industria. Si una nueva funcionalidad presenta fallas o degrada la experiencia, el rollback no requiere reconstruir contenedores, revertir commits en Git ni esperar entre 30 y 90 segundos a que el hosting actualice: **se apaga el flag en el panel y en 1 segundo la funcionalidad deja de ejecutarse** sin reiniciar el servidor ni interrumpir las sesiones activas.
- **Qué observabilidad y herramientas me faltan hoy para ejecutarlo**:
  1. *Servicio de Flags dinámico*: Falta integrar un gestor de flags externo (como Unleash, LaunchDarkly o una tabla en PostgreSQL con caché en memoria) que permita evaluar reglas por usuario en tiempo de ejecución. Una variable de entorno no sirve para este fin porque requeriría reiniciar o redesplegar el contenedor.
  2. *Monitoreo y Telemetría por feature*: Hoy solo contamos con el `/health` básico y logs de consola. Para flags se requiere observabilidad (APM / Prometheus / Grafana —que se verá en el TP9—) para medir automáticamente si la activación del flag incrementa los errores 500 o la latencia del backend.
  3. *Gestión de deuda técnica*: Disciplina del equipo para planificar la limpieza y eliminación de los condicionales (`if flag`) una vez que la funcionalidad quede consolidada en producción.

### Plan de rollback

En caso de detectarse una anomalía en producción tras un deploy aprobado, el procedimiento de rollback consiste en:

1. **Identificar el último commit estable**: Se consulta el historial de despliegues en GitHub (`gh api repos/.../deployments?environment=production`) para obtener el SHA inmediatamente anterior. En la práctica fue: `6d9dafdb3dc73c65ef922c1c2c2537b6aeb7e5e4`.
2. **Disparar los Deploy Hooks con el commit anterior**:
   ```bash
   SHA_ANTERIOR="6d9dafdb3dc73c65ef922c1c2c2537b6aeb7e5e4"
   curl -fsS "https://api.render.com/deploy/srv-das3njbbc2fs7396s1ng?key=m_Ta37P6NPc&ref=$SHA_ANTERIOR"
   curl -fsS "https://api.render.com/deploy/srv-das3phu0tbcc73dn74sg?key=N1aOGJ21hz0&ref=$SHA_ANTERIOR"
   ```
3. **Tiempo medido en la práctica**:
   - Se ejecutó el rollback de prueba desde la terminal cronometrando hasta que Render dejó el commit anterior en estado **Live** en producción.
   - **Tiempo medido: 31 segundos**.

4. **Limitación fundamental del rollback de código**:
   - El rollback mediante Deploy Hook **solo revierte los contenedores y el código de la aplicación**, pero **NO revierte cambios de esquema en la base de datos**.
   - Si una versión defectuosa ejecutó una migración destructiva (ej. borrar o renombrar una columna en Neon), volver al código anterior causará fallos inmediatos si ese código intenta consultar la estructura previa. Por esta razón, las migraciones en producción deben ser siempre compatibles hacia atrás (patrón *Expand/Contract*) o acompañadas de un plan de restauración de base de datos (Point-In-Time Recovery).

## Problemas encontrados y cómo los resolviste

### GITHUB_TOKEN no podía publicar en ghcr.io

Al intentar publicar las imágenes usando el `GITHUB_TOKEN` con `permissions: packages: write` en el job, el registry devolvía `permission_denied: write_package`. Esto ocurrió a pesar de configurar el repo en Settings → Actions → General → Workflow permissions → "Read and write permissions".

Diagnóstico: el `GITHUB_TOKEN` en algunas configuraciones de cuenta no tiene permiso para crear paquetes en ghcr.io. Los paquetes ya existían de TP2 (docker-compose.registry), pero la primera corrida con el nuevo pipeline falló igualmente.

Solución: se reemplazó el `GITHUB_TOKEN` por un PAT (Personal Access Token) con scope `write:packages`, guardado como secret `GHCR_TOKEN` en el repositorio. El concepto es el mismo: una credencial que el pipeline usa para autenticarse sin quedar en el código. La diferencia con el `GITHUB_TOKEN` es que el PAT requiere manejo manual (creación, rotación), pero resuelve el problema de permisos.

## Declaración de uso de IA

Utilicé IA (Antigravity/Gemini) a lo largo de todo el TP6 para:

1. Ajustar el backend en Go para aceptar `DATABASE_URL` y conexión SSL obligatoria requerida por PostgreSQL en Neon, preservando compatibilidad con Docker Compose local.
2. Ejecutar y cronometrar la práctica de rollback en producción (31s) y redactar las justificaciones técnicas de este documento.
Cada paso y comando fue revisado, probado y validado en la terminal y en las interfaces de GitHub y Render por mi mismo augurando que las acciones fueran las correctas.
También investigué por mi cuenta que fuera real el problema del github token y parece que es una falla que suele suceder. Encontré esto:

> **El paquete pertenece a una Cuenta de Usuario (No una Organización)** Si el repositorio y el paquete están bajo tu cuenta personal de usuario (ej. ://github.com...) y estás usando el registro de contenedores GHCR, GitHub tiene una limitación conocida: el GITHUB_TOKEN a veces no puede gestionar paquetes a nivel de usuario con la misma flexibilidad que en una organización. En cuentas personales, la autenticación cruzada suele requerir un PAT de manera obligatoria para la mutación de ciertos paquetes.

---

# Decisiones TP7

## Enlaces del TP7

- **Paquete backend en ghcr.io**: `https://github.com/Gabriellaniado/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend`
- **Paquete frontend en ghcr.io**: `https://github.com/Gabriellaniado/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend`
- **URL QA**: https://turnero-front-qa.onrender.com (API: https://turnero-api-qa.onrender.com)
- **URL PROD**: https://turnero-front-prod.onrender.com (API: https://turnero-api-prod.onrender.com)
- **Corrida de evidencia (Integración VERDE + E2E ROJA)**: _TODO: agregar URL de la corrida_
  - Artefacto de integración: `playwright-report-integracion` (VERDE)
  - Artefacto e2e: `playwright-report-e2e` (ROJO)
- **Corrida completa en verde posterior (hasta PROD)**: _TODO: agregar URL de la corrida_

---

## Build once, deploy many: qué problema del TP6 resuelve la imagen como unidad

En el TP6 el pipeline construía y publicaba imágenes en `ghcr.io`, pero Render estaba configurado para descargar el código fuente y reconstruir la aplicación en cada deploy (`docker build`). Esto rompía el principio fundamental de *promover exactamente lo que se verificó*: lo que corría en QA y en PROD no era la imagen verificada en CI, sino construcciones independientes a partir del commit. Dos builds en momentos distintos pueden diferir por actualizaciones en imágenes base (ej. parches de `golang:alpine` o `nginx:alpine`) o dependencias remotas.

En el TP7 se implementa **Build once, deploy many**:
- El pipeline compila y empaqueta la aplicación **una sola vez** en la etapa de CI.
- Publica la imagen inmutable en `ghcr.io` con la etiqueta `sha-<commit>`.
- Los entornos de QA y PROD dejan de compilar código y pasan a **ejecutar exactamente esa misma imagen binaria**.
- La promoción consiste en ordenarle a Render que ejecute esa imagen mediante el parámetro `imgURL` en el deploy hook, garantizando reproducibilidad absoluta entre entornos.

## Estrategia de etiquetas (sha-<commit> vs v7.0.0 vs por qué no latest)

- **`sha-<commit>` en el registry**: Cada imagen publicada lleva como etiqueta los 40 caracteres del commit exacto de `main` que pasó la verificación. Esto asegura trazabilidad bidireccional inmediata (de la imagen se llega al commit, y del commit a la imagen) y evita que una imagen pise a otra.
- **Por qué NO publicar `latest`**: `latest` es un puntero mutable que cambia con cada publicación. Desplegar `latest` a producción destruye la trazabilidad porque imposibilita determinar qué versión exacta del código se está ejecutando. En este proyecto no existe `latest`: cada imagen tiene un identificador unívoco.
- **`v7.0.0` en Git**: El tag de git no etiqueta código al azar ni la punta de la rama, sino el commit específico que fue promovido y verificado en producción al concluir el práctico.
- **Cómo llegás de la release a la imagen (en un paso)**: Desde el tag de Git se obtiene el commit con `git rev-list -n1 v7.0.0`, y ese mismo SHA es la etiqueta exacta `sha-<commit>` en ambos paquetes en GitHub Packages (`ghcr.io`).

## Configuración de Render con Existing Image

Para migrar los 4 servicios de Render a *Image-backed*:
- **Se modificó la fuente existente** (*Settings → Build/Source: Edit → Existing Image*) en lugar de crear nuevos servicios. Esto permitió preservar intactas las URLs públicas, las variables de entorno (`DATABASE_URL`, `BACKEND_URL`) y los secretos de los Deploy Hooks en GitHub.
- **La imagen configurada en Settings vs la que corre en producción**: En Render, la URL de imagen configurada en la interfaz web fue únicamente el punto de partida inicial (`sha-e00130e...`). Lo que efectivamente corre en cada entorno lo determina dinámicamente el pipeline en cada corrida mediante el parámetro `imgURL` en el Deploy Hook.

## Cómo se comprueba desde afuera que el entorno ejecuta la imagen (y qué no prueba el smoke)

- **Comprobación fehaciente**: En el panel de Render, en la pestaña **Events** de cada servicio, los despliegues figuran explícitamente como:
  `Deploy live for ghcr.io/gabriellaniado/ingsoft3-tp01-...:sha-<commit> · Triggered via Deploy Hook`
  Esto demuestra que el entorno descargó y levantó la imagen del registry sin reconstruir código desde Git.
- **Limitación del smoke test**: El smoke test verifica que la aplicación responda HTTP 200 en `/health` y `/`, pero no inspecciona qué versión de imagen está ejecutando. Si un deploy fallara en Render, el contenedor previo seguiría atendiendo tráfico y el smoke daría verde falsamente.

## Cómo la misma imagen del front sirve en QA y en PROD

La Single Page Application (SPA) construida con Vite genera archivos estáticos (HTML, JS, CSS) inmutables dentro de la imagen Docker basada en Nginx.
Para que esa misma imagen funcione tanto en QA como en PROD sin recompilar:
- Se utiliza la plantilla `default.conf.template` en `/etc/nginx/templates/`.
- Al arrancar el contenedor, Nginx sustituye `${BACKEND_URL}` y `${DNS_RESOLVER}` con los valores provistos por las variables de entorno de Render para ese entorno específico (`https://turnero-api-qa.onrender.com` en QA y `https://turnero-api-prod.onrender.com` en PROD).
- De este modo, el frontend empaquetado es idéntico e inmutable, y su comportamiento se adapta por configuración externa.

## Suites de integración y E2E: qué pruebas elegí y qué NO puse (la pirámide)

La estrategia de pruebas implementada respeta la **Pirámide de Automatización de Pruebas** (Mike Cohn):
- **Base (Unitarias - Vitest y Go `testing`)**: Pruebas rápidas, aisladas y deterministas en memoria que cubren exhaustivamente las ramas condicionales de la lógica de negocio (17 tests en frontend y cobertura >= 80% en backend).
- **Capa Media (Integración - Playwright `request`)**: Pruebas sin navegador que validan la interacción real de la API contra la base de datos PostgreSQL en Neon.
  - *Pruebas elegidas*:
    1. **Ciclo de vida de una entidad (Canchas)**: Login de administrador -> Creación vía `POST /api/courts` -> Verificación de persistencia real en Neon vía `GET /api/courts` -> Baja lógica vía `DELETE /api/courts/:id` -> Comprobación de que ya no figura activa.
    2. **Validación y rechazo en persistencia**: Intento de registrar un usuario con contraseña inválida (< 6 caracteres) devuelve HTTP 400 Bad Request y no genera registros huérfanos.
    3. **Seguridad de endpoints**: Verificación de rechazo con HTTP 401 Unauthorized ante credenciales erróneas y ante peticiones a rutas protegidas sin encabezado `Authorization`.
- **Cúspide (E2E - Playwright Chromium)**: Pruebas completas que levantan un navegador real interactuando contra la interfaz web desplegada en QA (`turnero-front-qa.onrender.com`).
  - *Pruebas elegidas*:
    1. **Flujo crítico de Administrador**: Acceso a `/login`, ingreso de credenciales válidas, redirección a `/admin/dashboard` y visualización del panel administrativo.
    2. **Validación visual de errores**: Intento de registro con email duplicado (`admin@turnero.com`), validando que la aplicación permanezca en `/register` y renderice el componente visual de alerta con el mensaje devuelto por el servidor.
    3. **Flujo crítico de Cliente**: Registro de nuevo usuario con datos dinámicos únicos (timestamp), navegación automática a su panel `/dashboard`, validación de bienvenida y posterior cierre de sesión exitoso con redirección a `/login`.
- **Qué NO puse en E2E y por qué**: No se duplicaron pruebas de validaciones campo por campo, combinatorias exhaustivas de formularios ni casos de error internos de negocio. Las pruebas de navegador son las más lentas de ejecutar (~10s vs ~1s) y las más propensas a fallas por red o renderizado. La cúspide debe limitarse estrictamente a los caminos críticos ("happy paths" y "unhappy paths" clave) que garantizan que el sistema está ensamblado y operativo para los usuarios.

## Integración amplia vs estrecha

- **Integración estrecha (narrow integration tests)**: Prueba la interacción entre dos o más módulos de código en un entorno controlado, utilizando dobles de prueba (mocks o stubs) para aislarse de la red, bases de datos o servicios externos. Son rápidas, pero no garantizan que la infraestructura real funcione.
- **Integración amplia (broad integration tests)**: Ejecuta el software completo desplegado contra su infraestructura y servicios reales de producción/QA.
- **Enfoque adoptado**: Nuestra suite `e2e/api.spec.ts` implementa **integración amplia**. No utiliza mocks ni bases de datos en memoria (SQLite/H2); apunta a la instancia viva de la API en Render y valida operaciones contra la base de datos PostgreSQL real alojada en Neon. Esto certifica que las variables de entorno, la cadena de conexión SSL, las migraciones de tablas y los permisos de usuario funcionan efectivamente de punta a punta.

## Manejo del cold start en free tier y qué es un test flaky

- **El problema del cold start**: En el plan gratuito de Render, las instancias web se suspenden tras 15 minutos de inactividad. El primer requerimiento puede demorar entre 30 y 60 segundos mientras el contenedor se aprovisiona y arranca. Si los tests disparan aserciones con timeouts estándar (5 segundos), fallarían falsamente por demoras de arranque del hosting.
- **Estrategia de mitigación aplicada**:
  1. **Smoke test previo en CI**: El job `deploy-qa` ejecuta un bucle activo de hasta 10 minutos (30 intentos de 20s) haciendo ping a `/health` y `/` hasta confirmar que los servicios están activos antes de disparar los jobs de prueba.
  2. **Timeouts adaptados en Playwright**: Se configuró `timeout: 60_000` (60s) por test y `expect: { timeout: 15_000 }` en `playwright.config.ts`.
  3. **Reintentos automáticos**: Se configuró `retries: 1` para absorber fluctuaciones transitorias de red o latencia de cold start.
- **Qué es un test flaky**: Es un test no determinista que, ejecutado sobre el mismo código, a veces pasa y a veces falla sin que medie ningún cambio en el software. Sus causas más frecuentes son condiciones de carrera en el DOM, esperas arbitrarias (`sleep` fijos) en lugar de aserciones asíncronas con auto-waiting (`expect(locator).toBeVisible()`), y dependencia de recursos externos con latencia variable. En Playwright se previenen usando selectores robustos y el mecanismo nativo de auto-espera del motor.

## Declaración de uso de IA

Utilicé IA (Antigravity/Gemini) en el TP7 para:
1. Diseñar y codificar las suites de pruebas con Playwright: la suite de integración de API (`api.spec.ts`) y la suite End-to-End con Chromium (`turnero.spec.ts`), configurando el proyecto dividido en `playwright.config.ts`.
2. Diagnosticar la recarga prematura de página producida por el interceptor de Axios 401 en el login y corregir el comportamiento en `client.ts`.
3. Configurar la secuencia de compuertas en GitHub Actions (`deploy-qa` ➔ `integracion` ➔ `e2e` ➔ `deploy-prod`) y la publicación de artefactos HTML de Playwright.
Cada paso, comando, prueba local y cambio de código fue revisado, probado y validado en la terminal y en los servicios de Render antes de su integración.
