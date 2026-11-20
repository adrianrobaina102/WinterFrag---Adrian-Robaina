#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform bool u_amargado;

// Funciones de distancia (SDF) para círculos, segmentos y formas de pera
float sdCirculo(vec2 p, vec2 c, float r) {
    return length(p - c) - r;
}

float sdSegmento(vec2 p, vec2 a, vec2 b, float r) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

float sdPera(vec2 p, vec2 c, float rx, float ry, float ensanche) {
    vec2 q = p - c;
    q.x /= mix(1.0 - ensanche, 1.0 + ensanche, smoothstep(ry, -ry, q.y));
    return length(q / vec2(rx, ry)) * min(rx, ry) - min(rx, ry);
}

// Convierte un contorno en una tira de puntos LED espaciados por fase
float tiraPuntos(float d, float fase) {
    float dPunto = length(vec2(d, sin(fase) * 0.011));
    return smoothstep(0.011, 0.002, dPunto) * 1.35 + 0.0016 / (d + 0.004);
}

// Dibuja una bombilla individual con halo luminoso
float bombilla(vec2 p, vec2 c, float r) {
    float d = length(p - c);
    return 0.0022 / (d + 0.003) + smoothstep(r, r * 0.2, d) * 1.5;
}

void main() {
    // Coordenadas normalizadas centradas y corregidas por relación de aspecto
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
    vec3 col = vec3(0.01, 0.015, 0.025);

    // Oscilaciones temporales para el parpadeo de luces y el estado amargado
    float titileo = 0.95 + 0.05 * sin(u_time * 10.0);
    float pulsoFuria = 0.75 + 0.25 * sin(u_time * 16.0);

    // --- SILUETAS BASE DEL GRINCH (Desplazado ligeramente a la derecha) ---
    vec2 offG = vec2(0.08, 0.0);
    float sCabeza = sdPera(p, vec2(0.0, 0.45) + offG, 0.13, 0.14, 0.35);
    float sCuello = sdSegmento(p, vec2(0.0, 0.32) + offG, vec2(0.0, 0.18) + offG, 0.025);
    float sTorso  = sdPera(p, vec2(0.0, -0.08) + offG, 0.15, 0.24, 0.30);

    // Collar de pelo picudo
    float sCollar1 = sdSegmento(p, vec2(-0.14, 0.16) + offG, vec2(0.0, 0.20) + offG, 0.012);
    float sCollar2 = sdSegmento(p, vec2( 0.14, 0.16) + offG, vec2(0.0, 0.20) + offG, 0.012);
    float sCollar3 = sdSegmento(p, vec2(-0.10, 0.13) + offG, vec2(0.0, 0.18) + offG, 0.012);
    float sCollar4 = sdSegmento(p, vec2( 0.10, 0.13) + offG, vec2(0.0, 0.18) + offG, 0.012);
    float sCollar  = min(min(sCollar1, sCollar2), min(sCollar3, sCollar4));

    // Brazos en jarra apoyados en la cintura
    float sBrazoIzq1 = sdSegmento(p, vec2(-0.08,  0.14) + offG, vec2(-0.28, -0.02) + offG, 0.018);
    float sBrazoIzq2 = sdSegmento(p, vec2(-0.28, -0.02) + offG, vec2(-0.13, -0.14) + offG, 0.018);
    float sBrazoDer1 = sdSegmento(p, vec2( 0.08,  0.14) + offG, vec2( 0.28, -0.02) + offG, 0.018);
    float sBrazoDer2 = sdSegmento(p, vec2( 0.28, -0.02) + offG, vec2( 0.13, -0.14) + offG, 0.018);
    float sBrazos    = min(min(sBrazoIzq1, sBrazoIzq2), min(sBrazoDer1, sBrazoDer2));

    // Piernas arqueadas y pies largos
    float sPiernaIzq1 = sdSegmento(p, vec2(-0.07, -0.30) + offG, vec2(-0.11, -0.46) + offG, 0.018);
    float sPiernaIzq2 = sdSegmento(p, vec2(-0.11, -0.46) + offG, vec2(-0.08, -0.62) + offG, 0.018);
    float sPieIzq     = sdSegmento(p, vec2(-0.08, -0.62) + offG, vec2(-0.22, -0.63) + offG, 0.016);

    float sPiernaDer1 = sdSegmento(p, vec2(0.07, -0.30) + offG, vec2(0.11, -0.46) + offG, 0.018);
    float sPiernaDer2 = sdSegmento(p, vec2(0.11, -0.46) + offG, vec2(0.08, -0.62) + offG, 0.018);
    float sPieDer     = sdSegmento(p, vec2(0.08, -0.62) + offG, vec2(0.22, -0.63) + offG, 0.016);
    float sPiernas    = min(min(min(sPiernaIzq1, sPiernaIzq2), sPieIzq), min(min(sPiernaDer1, sPiernaDer2), sPieDer));

    // Mechón rebelde de la cabeza
    float sMechon1 = sdSegmento(p, vec2(-0.01, 0.59) + offG, vec2(0.03, 0.69) + offG, 0.01);
    float sMechon2 = sdSegmento(p, vec2( 0.01, 0.58) + offG, vec2(0.07, 0.65) + offG, 0.009);
    float sMechon  = min(sMechon1, sMechon2);

    // --- LEDS VERDES DEL GRINCH (Con recorte de oclusión) ---
    float ledsVerdes = 0.0;
    ledsVerdes += tiraPuntos(abs(sCabeza), atan(p.y - 0.45, p.x - offG.x) * 20.0);

    if (sCabeza > 0.0) {
        ledsVerdes += tiraPuntos(abs(sMechon), p.y * 50.0);
    }
    if (sCabeza > 0.0 && sCollar > 0.0) {
        ledsVerdes += tiraPuntos(abs(sCuello), p.y * 40.0);
    }
    ledsVerdes += tiraPuntos(abs(sCollar), p.x * 42.0);

    if (sCollar > 0.0) {
        ledsVerdes += tiraPuntos(abs(sTorso), atan(p.y + 0.08, p.x - offG.x) * 24.0);
    }
    if (sTorso > 0.0 && sCollar > 0.0) {
        ledsVerdes += tiraPuntos(abs(sBrazos), (p.x + p.y) * 32.0);
        ledsVerdes += tiraPuntos(abs(sPiernas), (p.y + abs(p.x - offG.x)) * 32.0);
    }

    vec3 colorCuerpo = u_amargado ? vec3(0.28, 0.98, 0.02) : vec3(0.22, 0.88, 0.10);
    col += colorCuerpo * ledsVerdes;

    // --- EXPRESIÓN FACIAL DEL GRINCH (Ojos, cejas y boca) ---
    float ojos = bombilla(p, vec2(-0.042, 0.48) + offG, 0.014) + 
                 bombilla(p, vec2( 0.042, 0.48) + offG, 0.014);
    vec3 colorOjos = u_amargado ? vec3(1.0, 0.05, 0.05) * pulsoFuria : vec3(1.0, 0.85, 0.05);
    col += colorOjos * ojos;

    float sCejaIzq = sdSegmento(p, vec2(-0.085, 0.53) + offG, vec2(-0.015, 0.495) + offG, 0.008);
    float sCejaDer = sdSegmento(p, vec2( 0.085, 0.53) + offG, vec2( 0.015, 0.495) + offG, 0.008);
    float cejas = tiraPuntos(abs(sCejaIzq), p.x * 55.0) + tiraPuntos(abs(sCejaDer), p.x * 55.0);
    col += vec3(0.10, 0.55, 0.02) * cejas * titileo;

    // Boca: sonrisa malévola en estado normal o mueca arqueada si está amargado
    float sonrisa = 0.0;
    float pxG = p.x - offG.x;
    if (u_amargado) {
        float yMueca = 0.38 - 3.5 * pxG * pxG;
        float sMueca = sdSegmento(p, vec2(-0.07 + offG.x, yMueca), vec2(0.07 + offG.x, yMueca), 0.007);
        if (abs(pxG) < 0.07) {
            sonrisa += tiraPuntos(abs(sMueca), pxG * 45.0);
        }
    } else {
        float ySonrisa = 0.37 + 4.8 * pxG * pxG;
        float sSonrisa = sdSegmento(p, vec2(-0.095 + offG.x, ySonrisa), vec2(0.095 + offG.x, ySonrisa), 0.007);
        if (abs(pxG) < 0.095) {
            sonrisa += tiraPuntos(abs(sSonrisa), pxG * 45.0);
        }
    }
    vec3 colorBoca = u_amargado ? vec3(1.0, 0.15, 0.15) : vec3(0.15, 0.70, 0.05);
    col += colorBoca * sonrisa;

    // --- MAX EL PERRITO (Sentado a la izquierda mirando hacia arriba) ---
    vec2 offM = vec2(-0.34, -0.44);
    float sMaxCabeza = sdCirculo(p, vec2(0.0, 0.17) + offM, 0.068);
    float sMaxHocico = sdCirculo(p, vec2(0.01, 0.13) + offM, 0.045);
    float sMaxCuerpo = sdPera(p, vec2(-0.01, -0.02) + offM, 0.065, 0.11, 0.25);

    // Orejas caídas y largas
    float sMaxOrejaIzq = sdSegmento(p, vec2(-0.06, 0.18) + offM, vec2(-0.09, 0.06) + offM, 0.016);
    float sMaxOrejaDer = sdSegmento(p, vec2( 0.06, 0.18) + offM, vec2( 0.09, 0.06) + offM, 0.016);
    float sMaxOrejas   = min(sMaxOrejaIzq, sMaxOrejaDer);

    // Patas delanteras, patas traseras sentadas y cola levantada
    float sMaxPataIzq  = sdSegmento(p, vec2(-0.025, -0.02) + offM, vec2(-0.025, -0.18) + offM, 0.014);
    float sMaxPataDer  = sdSegmento(p, vec2( 0.025, -0.02) + offM, vec2( 0.025, -0.18) + offM, 0.014);
    float sMaxPieIzq   = sdSegmento(p, vec2(-0.04, -0.18) + offM, vec2(-0.09, -0.19) + offM, 0.014);
    float sMaxPieDer   = sdSegmento(p, vec2( 0.04, -0.18) + offM, vec2( 0.09, -0.19) + offM, 0.014);
    float sMaxCola     = sdSegmento(p, vec2(-0.07, -0.11) + offM, vec2(-0.13, 0.01) + offM, 0.012);
    float sMaxExtrem   = min(min(min(sMaxPataIzq, sMaxPataDer), min(sMaxPieIzq, sMaxPieDer)), sMaxCola);

    // LEDs marrón cálido del pelaje de Max
    float ledsMax = 0.0;
    if (sMaxHocico > 0.0) {
        ledsMax += tiraPuntos(abs(sMaxCabeza), atan(p.y - (0.17 + offM.y), p.x - offM.x) * 14.0);
    }
    ledsMax += tiraPuntos(abs(sMaxHocico), atan(p.y - (0.13 + offM.y), p.x - (0.01 + offM.x)) * 12.0);

    if (sMaxCabeza > 0.0 && sMaxCuerpo > 0.0) {
        ledsMax += tiraPuntos(abs(sMaxOrejas), p.y * 45.0);
    }
    if (sMaxHocico > 0.0 && sMaxCabeza > 0.0) {
        ledsMax += tiraPuntos(abs(sMaxCuerpo), atan(p.y - (-0.02 + offM.y), p.x - offM.x) * 16.0);
    }
    if (sMaxCuerpo > 0.0) {
        ledsMax += tiraPuntos(abs(sMaxExtrem), (p.x + p.y) * 40.0);
    }
    col += vec3(0.95, 0.50, 0.12) * ledsMax;

    // Collar rojo de Max
    float sMaxCollar = sdSegmento(p, vec2(-0.045, 0.085) + offM, vec2(0.045, 0.085) + offM, 0.012);
    col += vec3(1.0, 0.15, 0.15) * tiraPuntos(abs(sMaxCollar), p.x * 50.0);

    // Ojos de Max mirando hacia arriba al Grinch y su trufa
    float maxOjos = bombilla(p, vec2(-0.018, 0.195) + offM, 0.011) + 
                    bombilla(p, vec2( 0.028, 0.195) + offM, 0.011);
    col += vec3(0.95, 0.98, 1.0) * maxOjos;

    float maxNariz = bombilla(p, vec2(0.012, 0.145) + offM, 0.013);
    col += vec3(0.35, 0.45, 0.65) * maxNariz * titileo;

    // Mapeo tonal exponencial para suavizar los brillos intensos
    col = 1.0 - exp(-col * 1.4);
    gl_FragColor = vec4(col, 1.0);
}