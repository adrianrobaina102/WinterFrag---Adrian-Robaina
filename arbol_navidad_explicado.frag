#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    // Coordenadas normalizadas centradas (-1 a 1 en el eje vertical)
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;
    
    // Elevamos la base del árbol
    float y = p.y + 0.35;
    
    // 3 pisos del árbol mediante floor y fract
    float Y = y * 3.0;
    float nivel = floor(Y);
    float f = fract(Y);
    
    // Ancho decreciente en cada piso del pino
    float w = (3.0 - nivel) * 0.11 * (1.0 - f * 0.6);
    
    // Tronco de madera en la base
    float tronco = step(abs(p.x), 0.03) * step(abs(y - 0.05), 0.05);
    
    // Silueta escalonada del árbol
    float arbol = step(abs(y - 0.55), 0.45) * step(abs(p.x), w);
    
    // Guirnalda de luz cálida diagonal y estrella pulsante con u_time
    float guirnalda = smoothstep(0.02, 0.0, abs(sin(y * 22.0 + p.x * 9.0))) * arbol;
    float distEstrella = length(p - vec2(0.0, 0.67));
    float estrella = (0.01 + 0.004 * sin(u_time * 4.0)) / distEstrella;
    
    float luces = guirnalda + estrella;
    
    // Composición final de color (marrón tronco + verde pino + dorado luces)
    vec3 col = vec3(0.3, 0.15, 0.05) * tronco +
               vec3(0.0, 0.35, 0.0)  * arbol  +
               vec3(1.0, 0.85, 0.2)  * luces * 1.6;

    gl_FragColor = vec4(col, 1.0);
}