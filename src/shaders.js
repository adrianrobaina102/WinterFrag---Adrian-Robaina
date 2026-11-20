export function vertexShader() {
  return `
        varying vec3 vUv;
        varying vec4 modelViewPosition;

        void main() {
            vUv = position;
            vec4 modelViewPosition = modelViewMatrix * vec4(vUv, 1.0);
            gl_Position = projectionMatrix * modelViewPosition;
        }
    `;
}

// Shader 1: Muñeco de Nieve LED (muneco_leds_final.frag)
export function fragmentShader_muneco() {
  return `
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
    `;
}

// Shader 2: Árbol Navideño Tiny Code < 512 bytes (arbol_navidad_tiny.frag)
export function fragmentShader_arbol() {
  return `
        #ifdef GL_ES
        precision mediump float;
        #endif
        uniform vec2 u_resolution;
        uniform float u_time;
        void main(){
        vec2 p=(gl_FragCoord.xy*2.-u_resolution)/u_resolution.y;
        float y=p.y+.35,Y=y*3.,w=(3.-floor(Y))*.11*(1.-fract(Y)*.6);
        float T=step(abs(p.x),.03)*step(abs(y-.05),.05);
        float A=step(abs(y-.55),.45)*step(abs(p.x),w);
        float L=smoothstep(.02,0.,abs(sin(y*22.+p.x*9.)))*A+(.01+.004*sin(u_time*4.))/length(p-vec2(0,.67));
        vec3 c=vec3(.3,.15,.05)*T+vec3(0,.35,0)*A+vec3(1,.85,.2)*L*1.6;
        gl_FragColor=vec4(c,1);
        }
    `;
}

// Shader 3: Casita de Galleta de Jengibre (casita_galleta.frag)
export function fragmentShader_casita() {
  return `
        #ifdef GL_ES
        precision mediump float;
        #endif

        uniform vec2 u_resolution;

        void main() {
            vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);

            // Cielo nocturno oscuro + luna con halo suave
            vec3 col = vec3(0.01, 0.02, 0.05);
            float dLuna = length(p - vec2(-0.55, 0.52));
            col += vec3(0.95, 0.92, 0.80) * (step(dLuna, 0.09) + 0.015 / (dLuna + 0.05));

            // Suelo nevado ondulado
            float suelo = step(p.y, -0.39 + 0.025 * cos(p.x * 2.5));
            col = mix(col, vec3(0.75, 0.83, 0.94), suelo);

            // Pinito de fondo a la izquierda
            float troncoPino = step(abs(p.x + 0.58), 0.02) * step(abs(p.y + 0.34), 0.06);
            float copaPino   = step(abs(p.y + 0.14), 0.16) * step(abs(p.x + 0.58), (0.02 - p.y) * 0.55);
            col = mix(col, vec3(0.25, 0.14, 0.06), troncoPino);
            col = mix(col, vec3(0.05, 0.22, 0.10), copaPino);

            // Chimenea
            float chimenea = step(abs(p.x - 0.19), 0.045) * step(abs(p.y - 0.26), 0.11);
            col = mix(col, vec3(0.42, 0.20, 0.08), chimenea);

            // Paredes, borde de glaseado y tejado de galleta
            float pared = step(abs(p.x), 0.30) * step(abs(p.y + 0.18), 0.22);
            float techo = step(abs(p.y - 0.22), 0.18) * step(abs(p.x), (0.40 - p.y) * 1.05);
            float glaseadoTecho = step(abs(p.y - 0.23), 0.19) * step(abs(p.x), (0.425 - p.y) * 1.08);

            col = mix(col, vec3(0.95, 0.96, 1.0), glaseadoTecho);
            col = mix(col, vec3(0.58, 0.32, 0.14), clamp(pared + techo, 0.0, 1.0));

            // Puerta de chocolate
            float puerta = step(abs(p.x), 0.075) * step(abs(p.y + 0.28), 0.12);
            col = mix(col, vec3(0.25, 0.12, 0.05), puerta);

            // Ventanas iluminadas
            float ventAtico = step(length(p - vec2(0.0, 0.18)), 0.055);
            float ventLados = step(abs(abs(p.x) - 0.19), 0.048) * step(abs(p.y + 0.14), 0.048);
            col = mix(col, vec3(1.0, 0.80, 0.25), clamp(ventAtico + ventLados, 0.0, 1.0));

            gl_FragColor = vec4(col, 1.0);
        }
    `;
}
// Shader 4: Capa de Nieve Cayendo (nieve.frag)
export function fragmentShader_nieve() {
  return `
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
      `;
}
export function fragmentShader_grinch() {
    return `
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
  
      bool enfadado = u_amargado;
  
      // Oscilaciones temporales para parpadeos y temblor de rabia al nevar
      float titileo = 0.95 + 0.05 * sin(u_time * 10.0);
      float pulsoFuria = 0.70 + 0.30 * sin(u_time * 20.0);
      float temblor = enfadado ? sin(u_time * 55.0) * 0.006 : 0.0;
  
      // --- SILUETAS BASE DEL GRINCH ---
      vec2 offG = vec2(0.08 + temblor, 0.0);
      vec2 offC = vec2(0.08 + temblor * 0.4, 0.0);
  
      float sCabeza = sdPera(p, vec2(0.0, 0.45) + offG, 0.13, 0.14, 0.35);
      float sCuello = sdSegmento(p, vec2(0.0, 0.32) + offG, vec2(0.0, 0.18) + offC, 0.025);
      float sTorso  = sdPera(p, vec2(0.0, -0.08) + offC, 0.15, 0.24, 0.30);
  
      // Collar de pelo picudo
      float sCollar1 = sdSegmento(p, vec2(-0.14, 0.16) + offC, vec2(0.0, 0.20) + offC, 0.012);
      float sCollar2 = sdSegmento(p, vec2( 0.14, 0.16) + offC, vec2(0.0, 0.20) + offC, 0.012);
      float sCollar3 = sdSegmento(p, vec2(-0.10, 0.13) + offC, vec2(0.0, 0.18) + offC, 0.012);
      float sCollar4 = sdSegmento(p, vec2( 0.10, 0.13) + offC, vec2(0.0, 0.18) + offC, 0.012);
      float sCollar  = min(min(sCollar1, sCollar2), min(sCollar3, sCollar4));
  
      // Brazos: en jarra si está normal, o levantados en queja si nieva
      float sBrazoIzq1, sBrazoIzq2, sBrazoDer1, sBrazoDer2;
      if (enfadado) {
          sBrazoIzq1 = sdSegmento(p, vec2(-0.08, 0.14) + offC, vec2(-0.26, 0.22) + offC, 0.018);
          sBrazoIzq2 = sdSegmento(p, vec2(-0.26, 0.22) + offC, vec2(-0.22, 0.38) + offC, 0.018);
          sBrazoDer1 = sdSegmento(p, vec2( 0.08, 0.14) + offC, vec2( 0.26, 0.22) + offC, 0.018);
          sBrazoDer2 = sdSegmento(p, vec2( 0.26, 0.22) + offC, vec2( 0.22, 0.38) + offC, 0.018);
      } else {
          sBrazoIzq1 = sdSegmento(p, vec2(-0.08, 0.14) + offC, vec2(-0.28, -0.02) + offC, 0.018);
          sBrazoIzq2 = sdSegmento(p, vec2(-0.28, -0.02) + offC, vec2(-0.13, -0.14) + offC, 0.018);
          sBrazoDer1 = sdSegmento(p, vec2( 0.08, 0.14) + offC, vec2( 0.28, -0.02) + offC, 0.018);
          sBrazoDer2 = sdSegmento(p, vec2( 0.28, -0.02) + offC, vec2( 0.13, -0.14) + offC, 0.018);
      }
      float sBrazos = min(min(sBrazoIzq1, sBrazoIzq2), min(sBrazoDer1, sBrazoDer2));
  
      // Piernas arqueadas y pies largos
      float sPiernaIzq1 = sdSegmento(p, vec2(-0.07, -0.30) + offC, vec2(-0.11, -0.46) + offC, 0.018);
      float sPiernaIzq2 = sdSegmento(p, vec2(-0.11, -0.46) + offC, vec2(-0.08, -0.62) + offC, 0.018);
      float sPieIzq     = sdSegmento(p, vec2(-0.08, -0.62) + offC, vec2(-0.22, -0.63) + offC, 0.016);
  
      float sPiernaDer1 = sdSegmento(p, vec2(0.07, -0.30) + offC, vec2(0.11, -0.46) + offC, 0.018);
      float sPiernaDer2 = sdSegmento(p, vec2(0.11, -0.46) + offC, vec2(0.08, -0.62) + offC, 0.018);
      float sPieDer     = sdSegmento(p, vec2(0.08, -0.62) + offC, vec2(0.22, -0.63) + offC, 0.016);
      float sPiernas    = min(min(min(sPiernaIzq1, sPiernaIzq2), sPieIzq), min(min(sPiernaDer1, sPiernaDer2), sPieDer));
  
      // Mechón rebelde de la cabeza
      float sMechon1 = sdSegmento(p, vec2(-0.01, 0.59) + offG, vec2(0.03, 0.69) + offG, 0.01);
      float sMechon2 = sdSegmento(p, vec2( 0.01, 0.58) + offG, vec2(0.07, 0.65) + offG, 0.009);
      float sMechon  = min(sMechon1, sMechon2);
  
      // --- LEDS VERDES DEL GRINCH ---
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
          ledsVerdes += tiraPuntos(abs(sTorso), atan(p.y + 0.08, p.x - offC.x) * 24.0);
      }
      if (sTorso > 0.0 && sCollar > 0.0) {
          ledsVerdes += tiraPuntos(abs(sBrazos), (p.x + p.y) * 32.0);
          ledsVerdes += tiraPuntos(abs(sPiernas), (p.y + abs(p.x - offC.x)) * 32.0);
      }
  
      vec3 colorCuerpo = enfadado ? vec3(0.45, 1.0, 0.0) : vec3(0.22, 0.88, 0.10);
      col += colorCuerpo * ledsVerdes;
  
      // --- EXPRESIÓN FACIAL DEL GRINCH ---
      float ojos = bombilla(p, vec2(-0.042, 0.48) + offG, 0.016) + 
                   bombilla(p, vec2( 0.042, 0.48) + offG, 0.016);
      vec3 colorOjos = enfadado ? vec3(1.0, 0.02, 0.02) * pulsoFuria * 1.4 : vec3(1.0, 0.85, 0.05);
      col += colorOjos * ojos;
  
      // Cejas muy marcadas en V cuando está amargado
      float sCejaIzq, sCejaDer;
      if (enfadado) {
          sCejaIzq = sdSegmento(p, vec2(-0.105, 0.56) + offG, vec2(-0.008, 0.48) + offG, 0.012);
          sCejaDer = sdSegmento(p, vec2( 0.105, 0.56) + offG, vec2( 0.008, 0.48) + offG, 0.012);
      } else {
          sCejaIzq = sdSegmento(p, vec2(-0.085, 0.53) + offG, vec2(-0.015, 0.495) + offG, 0.008);
          sCejaDer = sdSegmento(p, vec2( 0.085, 0.53) + offG, vec2( 0.015, 0.495) + offG, 0.008);
      }
      float cejas = tiraPuntos(abs(sCejaIzq), p.x * 55.0) + tiraPuntos(abs(sCejaDer), p.x * 55.0);
      vec3 colorCejas = enfadado ? vec3(0.95, 0.15, 0.05) : vec3(0.10, 0.55, 0.02);
      col += colorCejas * cejas * titileo;
  
      // Boca: sonrisa malévola vs mueca de disgusto pronunciada
      float boca = 0.0;
      float pxG = p.x - offG.x;
      if (enfadado) {
          float yMueca = 0.40 - 5.5 * pxG * pxG;
          float sMueca = sdSegmento(p, vec2(-0.08 + offG.x, yMueca), vec2(0.08 + offG.x, yMueca), 0.009);
          if (abs(pxG) < 0.08) {
              boca += tiraPuntos(abs(sMueca), pxG * 45.0);
          }
      } else {
          float ySonrisa = 0.37 + 4.8 * pxG * pxG;
          float sSonrisa = sdSegmento(p, vec2(-0.095 + offG.x, ySonrisa), vec2(0.095 + offG.x, ySonrisa), 0.007);
          if (abs(pxG) < 0.095) {
              boca += tiraPuntos(abs(sSonrisa), pxG * 45.0);
          }
      }
      vec3 colorBoca = enfadado ? vec3(1.0, 0.10, 0.10) : vec3(0.15, 0.70, 0.05);
      col += colorBoca * boca;
  
      // --- MAX EL PERRITO ---
      vec2 offM = vec2(-0.34, enfadado ? -0.46 : -0.44);
      float sMaxCabeza = sdCirculo(p, vec2(0.0, 0.17) + offM, 0.068);
      float sMaxHocico = sdCirculo(p, vec2(0.01, 0.13) + offM, 0.045);
      float sMaxCuerpo = sdPera(p, vec2(-0.01, -0.02) + offM, 0.065, 0.11, 0.25);
  
      float aperturaOrejas = enfadado ? 0.072 : 0.09;
      float sMaxOrejaIzq = sdSegmento(p, vec2(-0.06, 0.18) + offM, vec2(-aperturaOrejas, 0.05) + offM, 0.016);
      float sMaxOrejaDer = sdSegmento(p, vec2( 0.06, 0.18) + offM, vec2( aperturaOrejas, 0.05) + offM, 0.016);
      float sMaxOrejas   = min(sMaxOrejaIzq, sMaxOrejaDer);
  
      float sMaxPataIzq  = sdSegmento(p, vec2(-0.025, -0.02) + offM, vec2(-0.025, -0.18) + offM, 0.014);
      float sMaxPataDer  = sdSegmento(p, vec2( 0.025, -0.02) + offM, vec2( 0.025, -0.18) + offM, 0.014);
      float sMaxPieIzq   = sdSegmento(p, vec2(-0.04, -0.18) + offM, vec2(-0.09, -0.19) + offM, 0.014);
      float sMaxPieDer   = sdSegmento(p, vec2( 0.04, -0.18) + offM, vec2( 0.09, -0.19) + offM, 0.014);
      float sMaxCola     = sdSegmento(p, vec2(-0.07, -0.11) + offM, vec2(-0.13, 0.01) + offM, 0.012);
      float sMaxExtrem   = min(min(min(sMaxPataIzq, sMaxPataDer), min(sMaxPieIzq, sMaxPieDer)), sMaxCola);
  
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
  
      float sMaxCollar = sdSegmento(p, vec2(-0.045, 0.085) + offM, vec2(0.045, 0.085) + offM, 0.012);
      col += vec3(1.0, 0.15, 0.15) * tiraPuntos(abs(sMaxCollar), p.x * 50.0);
  
      float maxOjos = bombilla(p, vec2(-0.018, 0.195) + offM, 0.011) + 
                      bombilla(p, vec2( 0.028, 0.195) + offM, 0.011);
      col += vec3(0.95, 0.98, 1.0) * maxOjos;
  
      float maxNariz = bombilla(p, vec2(0.012, 0.145) + offM, 0.013);
      col += vec3(0.35, 0.45, 0.65) * maxNariz * titileo;
  
      // Mapeo tonal exponencial para suavizar los brillos intensos
      col = 1.0 - exp(-col * 1.4);
      gl_FragColor = vec4(col, 1.0);
  }
  `;
  }