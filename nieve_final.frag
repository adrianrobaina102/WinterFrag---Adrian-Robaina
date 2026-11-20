#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// Generador pseudoaleatorio 2D para dar variedad a cada celda
float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

// Dibuja una capa de copos redondos, suaves y tranquilos
float capaNieve(vec2 uv, float escala, float velocidad) {
    uv *= escala;
    uv.y += u_time * velocidad;                    // Caída lenta hacia abajo
    uv.x += sin(u_time * 0.7 + uv.y * 0.6) * 0.25; // Vaivén suave por el viento

    vec2 id = floor(uv);          // Identificador entero de cada celda
    vec2 f = fract(uv) - 0.5;     // Coordenadas locales centradas en [-0.5, 0.5]

    // Deja ~25% de las celdas vacías para romper el patrón uniforme
    if (random(id + 9.1) < 0.25) return 0.0;

    // Posición aleatoria del copo dentro de su celda
    vec2 pos = (vec2(random(id), random(id + 7.3)) - 0.5) * 0.55;
    float d = length(f - pos);

    // Tamaño y brillo variados por copo 
    float radio = mix(0.03, 0.065, random(id + 3.1));
    float brillo = mix(0.55, 0.95, random(id + 5.2));
    return smoothstep(radio, radio * 0.5, d) * brillo;
}

void main() {
    // Coordenadas normalizadas centradas y corregidas por relación de aspecto
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;

    // 3 capas de profundidad cayendo despacio
    float nieve = 0.0;
    nieve += capaNieve(p, 4.2, 0.42) * 0.85;        // Copos cercanos (más nítidos)
    nieve += capaNieve(p + 1.3, 7.0, 0.28) * 0.55;  // Copos intermedios
    nieve += capaNieve(p + 2.7, 10.5, 0.18) * 0.30; // Copos lejanos

    // Blanco nieve frío
    vec3 col = vec3(0.92, 0.96, 1.0) * nieve;
    gl_FragColor = vec4(col, 1.0);
}