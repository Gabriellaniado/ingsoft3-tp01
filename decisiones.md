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
