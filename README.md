# Sofía

Página web interactiva hecha con HTML, CSS y JavaScript para preguntar:

> ¿Quieres celebrar conmigo nuestro primer mes? 💕

La página empieza con una pregunta, botones de `Si` y `No`, GIFs, corazones animados y música de fondo. Si se pulsa `No`, el botón va cambiando de texto y el botón `Si` crece. Si se pulsa `Si`, se abre una página final con confeti, música y una foto personalizada.

En la página final, catorce pulsaciones sobre la foto de pareja descubren el acceso al segundo mes. Después se pide una contraseña con la pista «Lo más importante para mí». Mía conserva su animación especial de cinco caricias. El capítulo nuevo incluye dos recuerdos y una carta.

El capítulo 2 presenta además una animación de Mía tumbada, moviendo las patitas y restregándose suavemente antes de iniciar la misión.

Después de encontrar los dos recuerdos, el capítulo 2 incluye **La ruta de los recuerdos**, un minijuego de carrera protagonizado únicamente por Sofía con su uniforme de auxiliar de enfermería. El recorrido alterna el Pasaje de Lodares de Albacete y la costa de Aguamarina/Campoamor. Los dos escenarios usan fondos fotográficos optimizados y los coleccionables y obstáculos son assets PBR con transparencia; Canvas conserva la perspectiva, las animaciones, las colisiones y los efectos. El movimiento sigue un estilo Temple Run: carrera con apoyos y pasos sincronizados, cambio de carril con inclinación y frenado, salto articulado en seis fases con arco, preparación de aterrizaje y caída rápida opcional, y deslizamiento en seis fases sincronizado con la colisión. Las acciones se pueden encadenar, el control lateral se mantiene en el aire y las estructuras elevadas conservan su profundidad al atravesarlas. La cámara reacciona a zancadas, giros e impactos sin temblores aleatorios. El render separa el paisaje prerenderizado de una capa interactiva de mayor resolución para que Sofía, los corazones y los obstáculos conserven bordes definidos en móvil; la adaptación de calidad reduce primero el fondo y mantiene un mínimo de nitidez para los elementos jugables. La canción acompaña la carrera con una mezcla adaptativa y Web Audio añade pasos según la superficie, avisos, impactos y melodías distintas para corazones, escudos, combos y cambios de escenario. Se puede jugar con teclado o gestos táctiles y conserva el récord, un histórico local de las diez mejores puntuaciones y la preferencia de sonido en el dispositivo.

Al reunir las cinco letras de **SOFÍA**, el juego desbloquea el vídeo que ella regaló por sus dos meses, cargado bajo demanda desde Google Drive; el archivo no forma parte del repositorio ni del despliegue de GitHub Pages.

La referencia visual del Pasaje de Lodares parte de la fotografía de [Diego Delso](https://commons.wikimedia.org/wiki/File:Pasaje_de_Lodares,_Albacete,_Espa%C3%B1a,_2022-07-12,_DD_02-04_HDR.jpg), publicada con licencia [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

## Demo

Cuando esté publicada con GitHub Pages:

[sofia.diegoayala.com](https://sofia.diegoayala.com/)

## Archivos principales

```text
sofia/
├── index.html        # Página principal con la pregunta
├── yes.html          # Página final después de pulsar "Si"
├── script.js         # Lógica de la página principal
├── yes-script.js     # Confeti y música de la página final
├── dos-meses/        # Capítulo secreto tras 14 pulsaciones y protegido por contraseña
├── style.css         # Estilos, corazones, botones y foto
├── assets/
│   ├── favicon-sofia-diego.png # Icono de la pestaña
│   ├── sofia-diego2.jpg        # Foto de la página final
│   └── walking-dachshund-animated.webp # Salchicha animado de la página final
└── music/
    └── ...mp3        # Música de fondo
```

## Qué se puede personalizar

- La pregunta principal está en `index.html`.
- Los mensajes que aparecen al pulsar `No` están en `script.js`, en el array `noMessages`.
- Los mensajes que aparecen al pulsar `Si` antes de jugar con el `No` están en `script.js`, en el array `yesTeasePokes`.
- El texto de la página final está en `yes.html`.
- Los dos recuerdos del segundo mes están en `dos-meses/script.js`.
- La carta final está en `dos-meses/index.html`.
- La foto final está en `assets/sofia-diego2.jpg`.
- El favicon está en `assets/favicon-sofia-diego.png`.
- Los colores, bordes, tamaños, corazones y estilo de la foto están en `style.css`.

## Desarrollo local

No hace falta instalar nada. Puedes abrir directamente:

```text
index.html
```

También puedes abrir `yes.html` directamente para probar la página final.

## Comparación de GIFs de perros salchicha

Abre `comparar-gifs.html` para ver las dos alternativas preparadas:

- `index-internet.html`: selección de GIFs de internet.
- `index-imagegen.html`: un único cachorro coherente generado con ImageGen.
- `index-imagegen-realista.html`: versión fotográfica basada en las dos fotos del perro salchicha chocolate.

La página principal `index.html` usa la opción realista basada en las fotos del perro salchicha chocolate.

## Publicación

El repo está pensado para publicarse con GitHub Pages desde la rama `main`.

Para publicar cambios:

```bash
git add .
git commit -m "Actualiza la web de nuestro primer mes"
git push origin main
```

GitHub Pages actualizará la web automáticamente después de unos segundos o minutos.
