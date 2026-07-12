# Sofía

Página web interactiva hecha con HTML, CSS y JavaScript para preguntar:

> ¿Quieres celebrar conmigo nuestro primer mes? 💕

La página empieza con una pregunta, botones de `Si` y `No`, GIFs, corazones animados y música de fondo. Si se pulsa `No`, el botón va cambiando de texto y el botón `Si` crece. Si se pulsa `Si`, se abre una página final con confeti, música y una foto personalizada.

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
