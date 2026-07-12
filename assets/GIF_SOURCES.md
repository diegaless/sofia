# Opciones de GIFs de perros salchicha

## Opción A: selección de internet

Los GIFs se guardan localmente en `assets/gifs-internet/`. Páginas originales:

| Etapa | Emoción | Fuente |
|---|---|---|
| 0 | Normal / atento | [Tenor](https://tenor.com/view/yes-yess-dachshund-nods-cute-gif-17881993) |
| 1 | Confuso | [Tenor](https://tenor.com/view/confused-dog-weinerdog-gif-13842990) |
| 2 | Suplicando | [Tenor](https://tenor.com/view/sad-eyes-begging-puppy-dog-eyes-talking-talk-funny-animals-gif-6333485909996521744) |
| 3 | Triste | [Tenor](https://tenor.com/view/sad-face-dog-cute-dachshund-puppy-gif-16689877) |
| 4 | Más triste | [Tenor](https://tenor.com/view/teckel-dashchund-daschund-puppy-sad-gif-18005552) |
| 5 | Devastado | [Tenor](https://tenor.com/view/i-heard-my-name-no-im-not-alright-sad-daushund-dog-sad-dog-sad-dog-meme-gif-10280031103261147001) |
| 6 | Llorando | [Tenor](https://tenor.com/view/animal-brown-comedy-crying-dachshund-gif-4929165609215547481) |
| 7 | Huyendo | [Tenor](https://tenor.com/view/beanie-dachshund-dachshund-running-dog-flying-dog-sausage-dog-gif-25861711) |

## Opción B: ImageGen

Las ocho escenas se generaron con la herramienta integrada de ImageGen. El prompt base pidió un cachorro salchicha negro y fuego, estilo de película 3D, fondo rosa y composición cuadrada. Cada prompt posterior mantuvo el mismo personaje y cambió únicamente la emoción o la pose: confuso, suplicando, triste, una lágrima, devastado, sollozando y huyendo mientras llora.

Los PNG originales están en `assets/imagegen-sources/`. Los GIFs derivados están en `assets/gifs-imagegen/` y se pueden reconstruir con:

```bash
python3 scripts/build-imagegen-gifs.py
```

## Opción C: ImageGen realista basado en las fotos

Las fotos `20260622_113357.jpg` y `20260622_113403.jpg` se usaron como referencias de identidad del mismo perro. El prompt base pidió fotografía natural de estudio del salchicha adulto de pelaje corto chocolate oscuro, ojos avellana, hocico largo, orejas caídas y cuerpo redondeado, sobre fondo rosa claro. Las siete variantes conservaron el mismo perro y cambiaron únicamente pose y emoción: confuso, suplicando, triste, una lágrima, devastado, sollozando tumbado y huyendo mientras llora.

Los PNG originales están en `assets/imagegen-realista-sources/` y los GIFs derivados en `assets/gifs-imagegen-realista/`.
