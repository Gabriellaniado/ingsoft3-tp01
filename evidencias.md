# Evidencias — TP1

## 1. Push directo a main rechazado
![push rechazado](img/01-push-rechazado.png)
GitHub rechaza el push porque main está protegida y la regla alcanza también al dueño del repo.

## 2. El PR de la rama B no se puede mergear: conflicto
![conflicto en pr](img/02-conflicto-en-pr.png)
Se genera un conflicto porque se intenta mergear en main dos ramas que parten del mismo commit y que modifican la misma linea.

## 3. Los marcadores del conflicto
![Marcadores del conflicto](img/03-marcadores-conflicto.png)
GitHub permite visualizar el editor de conflictos con la version de la rama actual y la que está en main seprados por ====

## 4. La release v1.0.0 publicada
![Release publicada](img/04-release-publicada.png)
Se creó una release a partir del tag creado desde la terminal que nos indica cuál es la version para hacer el release.

# Evidencias — TP2

## 1. docker compose up -d desde cero
![docker compose up --build](img/06-dockercompose--build.png) 
Se inicia el sistema desde cero.

![docker compose up -d](img/06-dockercompose-d.png) 
Se inicia el sistema en modo detached.
## 2. Prueba de persistencia

![Canchas creadas](img/08-canchas-creadas.png)
Se crean canchas y datos desde la aplicación web para probar la persistencia.

![Docker compose down](img/09-docker-compose-down.png)
Se bajan los contenedores con `docker compose down` y al volver a levantarlos los datos persisten gracias al volumen montado de PostgreSQL.

![Docker compose down -v](img/10-docker-compose-down-v.png)
Se ejecutan los contenedores deteniéndolos con la opción `-v` (`docker compose down -v`) para eliminar los volúmenes asociados.

![Volumen eliminado](img/11-volumen-eliminado.png)
Se verifica la eliminación del volumen y que la base de datos se reinicializa limpiamente.

## 3. Comparación de tamaño imagen final vs imagen de SDK
![comparación de tamaño imagen final vs imagen de SDK](img/05-imagen-final-vs-imagen-de-sdk.png)
Se puede observar claramente la diferencia de tamaño entre la imagen final y la imagen de SDK.  

## 4. Imágenes publicadas en el registry.
![publicación imágenes registry](img/07-imagenes-en-registry.png)
