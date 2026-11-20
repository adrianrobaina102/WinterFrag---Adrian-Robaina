#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// Funciones de distancia (SDF) para círculos y segmentos con grosor
float sdCirculo(vec2 p, vec2 c, float r) {
    return length(p - c) - r;
}

float sdSegmento(vec2 p, vec2 a, vec2 b, float r) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

// Convierte un contorno en una tira de puntos LED usando sin(fase) para espaciarlos
float tiraPuntos(float d, float fase) {
    float dPunto = length(vec2(d, sin(fase) * 0.012));
    return smoothstep(0.012, 0.002, dPunto) * 1.35 + 0.0018 / (d + 0.004);
}

// Dibuja una bombilla individual con halo luminoso
float bombilla(vec2 p, vec2 c, float r) {
    float d = length(p - c);
    return 0.0025 / (d + 0.003) + smoothstep(r, r * 0.2, d) * 1.5;
}

void main() {
    // Coordenadas normalizadas centradas y corregidas por relación de aspecto
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
    vec3 col = vec3(0.01, 0.015, 0.025);

    // Oscilaciones temporales para el parpadeo de las luces
    float titileo = 0.95 + 0.05 * sin(u_time * 10.0);
    float pulsoRojo = 0.85 + 0.15 * sin(u_time * 3.0);

    // Siluetas base (valores > 0 están fuera) usadas para ocultar líneas tapadas (oclusión)
    float sCabeza = sdCirculo(p, vec2(0.0, 0.14), 0.22);
    float sCuello = sdSegmento(p, vec2(-0.19, -0.05), vec2(0.19, -0.05), 0.055);
    float sCola   = sdSegmento(p, vec2(0.11, -0.05), vec2(0.14, -0.28), 0.042);
    float sBufanda = min(sCuello, sCola);

    float sBordeGorro = sdSegmento(p, vec2(-0.19, 0.27), vec2(0.18, 0.23), 0.045);
    float sPompon     = sdCirculo(p, vec2(0.24, 0.40), 0.055);

    // --- LEDS BLANCOS ---
    float ledsBlancos = 0.0;

    // Panza (abs() extrae solo el borde; se oculta detrás de cabeza y bufanda)
    float dPanza = abs(sdCirculo(p, vec2(0.0, -0.28), 0.35));
    if (sBufanda > 0.0 && sCabeza > 0.0) {
        float fasePanza = atan(p.y + 0.28, p.x) * 24.0;
        ledsBlancos += tiraPuntos(dPanza, fasePanza);
    }

    // Cabeza (se recorta donde tapan la bufanda y el gorro)
    float dCabeza = abs(sCabeza);
    if (sBufanda > 0.0 && sBordeGorro > 0.0 && p.y < 0.24) {
        float faseCabeza = atan(p.y - 0.14, p.x) * 18.0;
        ledsBlancos += tiraPuntos(dCabeza, faseCabeza);
    }

    // Borde del gorro (proyección sobre el segmento para repartir los LEDs a lo largo)
    vec2 pBorde = p - vec2(-0.19, 0.27);
    vec2 dirBorde = vec2(0.18, 0.23) - vec2(-0.19, 0.27);
    float hBorde = clamp(dot(pBorde, dirBorde) / dot(dirBorde, dirBorde), 0.0, 1.0);
    float faseBorde = hBorde * 28.0 + atan((pBorde - dirBorde * hBorde).y, (pBorde - dirBorde * hBorde).x) * 4.0;
    ledsBlancos += tiraPuntos(abs(sBordeGorro), faseBorde);

    // Pompón del gorro
    float dPompon = abs(sPompon);
    float fasePompon = atan(p.y - 0.40, p.x - 0.24) * 8.0;
    ledsBlancos += tiraPuntos(dPompon, fasePompon);

    col += vec3(0.92, 0.96, 1.0) * ledsBlancos * titileo;

    // --- LEDS ROJOS (Gorro y Bufanda) ---
    float ledsRojos = 0.0;
    if (p.y > 0.24 && sBordeGorro > 0.0 && sPompon > 0.0) {
        float dCopa = abs(sdCirculo(p, vec2(0.01, 0.29), 0.21));
        float faseCopa = atan(p.y - 0.29, p.x - 0.01) * 16.0;
        ledsRojos += tiraPuntos(dCopa, faseCopa);
    }

    float dCuello = abs(sCuello);
    ledsRojos += tiraPuntos(dCuello, p.x * 30.0);
    if (sCuello > 0.0) {
        float dCola = abs(sCola);
        ledsRojos += tiraPuntos(dCola, p.y * 30.0);
    }
    col += vec3(1.0, 0.15, 0.20) * ledsRojos * pulsoRojo;

    // --- NARIZ DE ZANAHORIA ---
    float sNariz = sdSegmento(p, vec2(-0.11, 0.12), vec2(0.01, 0.12), 0.018);
    col += vec3(1.0, 0.50, 0.05) * tiraPuntos(abs(sNariz), p.x * 60.0) * titileo;

    // --- BOMBILLAS INDIVIDUALES (Ojos, Botones y Sonrisa) ---
    float ojos = bombilla(p, vec2(-0.08, 0.18), 0.020) +
                 bombilla(p, vec2( 0.08, 0.18), 0.020);
    col += vec3(0.25, 0.75, 1.0) * ojos;

    float botones = bombilla(p, vec2(-0.03, -0.16), 0.022) +
                    bombilla(p, vec2(-0.03, -0.28), 0.022);
    col += vec3(1.0, 0.85, 0.2) * botones * titileo;

    float sonrisa = bombilla(p, vec2(-0.08, 0.06),  0.013) +
                    bombilla(p, vec2(-0.04, 0.04),  0.013) +
                    bombilla(p, vec2( 0.00, 0.035), 0.013) +
                    bombilla(p, vec2( 0.04, 0.04),  0.013) +
                    bombilla(p, vec2( 0.08, 0.06),  0.013);
    col += vec3(1.0, 0.90, 0.3) * sonrisa;

    // Mapeo tonal exponencial para suavizar los brillos intensos (tone mapping)
    col = 1.0 - exp(-col * 1.4);
    gl_FragColor = vec4(col, 1.0);
}