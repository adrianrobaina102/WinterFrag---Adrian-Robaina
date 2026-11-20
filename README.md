# WinterFrag - Adrian Robaina

**Asignatura:** Informática Gráfica (IG) — Práctica S9: Fragment Shaders en GLSL y Three.js  
**Temática:** Iluminación Decorativa e Ilustración Procedural Navideña  

---

## Enlaces Directos

[![Video Demostración](https://img.shields.io/badge/YOUTUBE-VIDEO_DEMOSTRACIÓN-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/qCxdnhgdqtA)
[![Abrir en CodeSandbox](https://img.shields.io/badge/CODESANDBOX-ABRIR_VISOR_WEB-151515?style=for-the-badge&logo=codesandbox&logoColor=white)](https://codesandbox.io/p/sandbox/distracted-dust-5mzxmd)

---

## Motivación

Con la llegada de la campaña navideña, el objetivo de esta práctica es recrear la estética de los escaparates y decoraciones luminosas LED de invierno usando únicamente matemáticas en tiempo real (sin texturas externas ni modelos 3D). Se combinan escenas LED procedurales (un muñeco de nieve y el Grinch junto a Max, con cambio de expresión interactivo), una capa atmosférica de nieve superpuesta y un reto *Tiny Code* (< 512 bytes) de un árbol navideño.

---

## Estructura del Proyecto

```text
├── src/
│   ├── index.html                   # Visor web con Three.js y barra de control inferior
│   ├── main.js                      # Escena, cámara fija, blending de nieve y controles
│   ├── shaders.js                   # Shaders en GLSL integrados en Three.js
│   └── style.css                    # Hoja de estilos de la interfaz
├── arbol_navidad_explicado.frag     # Versión legible y comentada del Tiny Code
├── arbol_navidad_tiny.frag          # Shader "Tiny Code" (<512 Bytes: 511 B exactos)
├── grinch.frag                      # Shader del Grinch y Max con estado dual
├── muneco_leds_final.frag           # Shader Principal para editor.thebookofshaders.com
├── nieve_final.frag                 # Shader de capa de nieve procedural
├── package.json                     # Configuración y dependencias del proyecto
└── README.md                        # Documentación y memoria técnica unificada
```

---

## Cómo Ejecutar la Práctica

### 1. Visor Web (CodeSandbox)
1. Haz clic en **[Abrir en CodeSandbox](https://codesandbox.io/p/sandbox/distracted-dust-5mzxmd)** (o abre el proyecto en un servidor local).
2. La escena carga en Three.js con cámara fija centrada y los siguientes controles interactivos:
   - **Botón `⛄ Muñeco [1]` o Tecla [1]:** Carga el Muñeco de Nieve LED (Shader Principal).
   - **Botón `🎄 Árbol [2]` o Tecla [2]:** Carga el Árbol de Navidad (*Tiny Code* de 511 bytes).
   - **Botón `👹 Grinch [3]` o Tecla [3]:** Carga la escena LED del Grinch y Max.
   - **Botón `❄️ Modo Nieve [4]` / `😠 Calmar Grinch [4]` o Tecla [4]:** Control contextual inteligente:
     - En el **Muñeco** o el **Árbol**, activa o desactiva la capa frontal de nieve (`planoNieve`).
     - En el **Grinch**, oculta la nieve y activa el `uniform bool u_amargado`, cambiando su postura (brazos levantados en queja), su expresión facial y añadiendo temblor en tiempo real.
   - **Botón `⏸ Pausa` o Tecla [Espacio]:** Detiene o reanuda la animación temporal (`u_time`).

### 2. The Book of Shaders
1. Entra en [editor.thebookofshaders.com](http://editor.thebookofshaders.com/).
2. Pega el contenido de cualquiera de los archivos `.frag` de la raíz:
   - **muneco_leds_final.frag**
   - **arbol_navidad_tiny.frag**
   - **arbol_navidad_explicado.frag**
   - **grinch.frag**
   - **nieve_final.frag**
3. Todos compilan y corren a 60 FPS de forma nativa sin requerir librerías externas.

---

## Memoria Técnica de los Shaders

### 1. Shader Principal: Muñeco de Nieve LED (`muneco_leds_final.frag`)
- **Campos de Distancia con Signo (SDF):** Trazado vectorial exacto de círculos (`sdCirculo`) y segmentos con grosor (`sdSegmento`) para construir cuerpo, cabeza, gorro, pompón, bufanda asimétrica, nariz, ojos, botones y sonrisa.
- **Tira Continua de Luces LED:** Simulación analítica de bombillas distribuidas a lo largo del perímetro mediante modulación angular (`atan`) y proyección lineal (`dot`), con núcleo intenso y caída inversa para simular el halo luminoso.
- **Jerarquía de Oclusión:** Uso de las siluetas SDF (`> 0.0`) para recortar las líneas traseras donde quedan cubiertas por la bufanda o el gorro, evitando superposiciones artificiales.
- **Mapeo Tonal (Tonemapping):** Compresión exponencial (`1.0 - exp(-col * 1.4)`) para evitar que los brillos acumulados saturen a blanco plano y conservar los matices cromáticos.

### 2. Shader "Tiny Code": Árbol de Navidad (`arbol_navidad_tiny.frag`)
- **Tamaño:** **511 Bytes** exactos en codificación UTF-8 (cumple la restricción de < 512 B para el *reel* conjunto).
- **Diseño Procedural:**
  - Silueta de pino en 3 niveles decrecientes generada con funciones periódicas (`floor` y `fract`).
  - Tronco rectangular en la base, guirnalda diagonal sinusoidal y estrella superior con pulsación armónica ligada a `u_time`.
- **Versión Explicada:** Se adjunta `arbol_navidad_explicado.frag` con el código legible y comentado.

### 3. Escena Interactiva: Grinch y Max (`grinch.frag` / `shaders.js`)
- **Deformación de Dominio (`sdPera`):** Modulación no lineal del eje horizontal mediante `smoothstep` para transformar primitivas circulares en la anatomía de pera característica de la cabeza y el torso del Grinch, así como el cuerpo de su perro Max.
- **Composición Multi-Personaje y Oclusión:** Posicionamiento relativo (`offG` y `offM`) para encuadrar ambas figuras sobre la misma línea base con paletas LED diferenciadas (verde neón para el Grinch y tonos ámbar/cálidos con collar rojo para Max), aplicando recortes SDF (`> 0.0`) en cuello, extremidades y orejas.
- **Máquina de Estados por `uniforms` (`u_amargado`):** El botón `[4]` conmuta en tiempo real entre dos estados completos sin recompilar el shader:
  - *Estado Normal:* Brazos en jarra apoyados en la cintura, ojos amarillos y sonrisa parabólica ascendente.
  - *Estado Enfadado:* Brazos alzados en señal de queja, cejas gruesas fruncidas en V, mueca invertida hacia abajo, ojos rojo intenso con pulso armónico y vibración horizontal de alta frecuencia (`sin(u_time * 55.0)`).

### 4. Capa Atmosférica de Nieve (`nieve_final.frag`)
- **Parallax en 3 Capas:** Tres cuadrículas superpuestas a distintas escalas y velocidades (`4.2`, `7.0` y `10.5`) para crear sensación de profundidad.
- **Aleatoriedad e Irregularidad:** Desplazamiento pseudoaleatorio por celda, tamaño y brillo individual por copo, y descarte del ~25% de las celdas para romper el patrón de rejilla.
- **Integración en Three.js:** Renderizado en un plano frontal transparente con `THREE.AdditiveBlending` y `depthWrite: false`, permitiendo superponer la nevada sin interferir con el *depth buffer*.

---

## Fuentes y Referencias
- **Inigo Quilez:** *2D Distance Functions* (formulación matemática de SDF para círculos, segmentos y deformaciones de dominio).
- **Patricio Gonzalez Vivo & Jen Lowe:** *The Book of Shaders* (espacio de coordenadas normalizado, funciones de forma, aleatoriedad 2D y uso de `u_time` / `u_resolution`).
- **Three.js Documentation:** `THREE.ShaderMaterial`, `THREE.AdditiveBlending` y actualización dinámica de `uniforms` en tiempo de ejecución.
- **Especificación GLSL ES 1.00:** Funciones intrínsecas (`atan`, `smoothstep`, `fract`, `floor`, `exp`) y técnicas de compresión de código (*code golf* / *Tiny Code*).
