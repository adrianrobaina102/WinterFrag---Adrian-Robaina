import * as THREE from "three";
import {
  vertexShader,
  fragmentShader_muneco,
  fragmentShader_arbol,
  fragmentShader_grinch,
  fragmentShader_nieve,
} from "./shaders.js";

let scene, renderer, camera;
let uniforms;
let materialActual, planoMesh, planoNieve;
let pausado = false;
let nieveActiva = false;
let shaderActual = 1; // 1: Muñeco, 2: Árbol, 3: Grinch

function init() {
  camera = new THREE.PerspectiveCamera(
    20,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);

  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const container =
    document.getElementById("canvas-container") || document.body;
  container.appendChild(renderer.domElement);

  uniforms = {
    u_time: { type: "f", value: 0.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
    u_amargado: { type: "b", value: false },
  };

  const geometry = new THREE.PlaneGeometry(5, 5);
  materialActual = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader_muneco(),
  });

  planoMesh = new THREE.Mesh(geometry, materialActual);
  scene.add(planoMesh);

  // Plano 2 (delante): la nieve con AdditiveBlending
  const materialNieve = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader_nieve(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  planoNieve = new THREE.Mesh(geometry, materialNieve);
  planoNieve.position.z = 0.01;

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = window.innerWidth * window.devicePixelRatio;
  uniforms.u_resolution.value.y = window.innerHeight * window.devicePixelRatio;
}

document.onmousemove = function (e) {
  uniforms.u_mouse.value.x = e.pageX / window.innerWidth;
  uniforms.u_mouse.value.y = e.pageY / window.innerHeight;
};

function animationLoop() {
  requestAnimationFrame(animationLoop);
  if (!pausado) {
    uniforms.u_time.value += 0.05;
  }
  renderer.render(scene, camera);
}

// Función auxiliar para sincronizar la nieve y el enfado del Grinch
function actualizarEstadoNieve() {
  const btn4 = document.getElementById("btnShader4");
  uniforms.u_amargado.value = nieveActiva;

  // Si nieva y NO es el Grinch (o si quieres que caiga nieve también con el Grinch, quita "&& shaderActual !== 3")
  if (nieveActiva && shaderActual !== 3) {
    scene.add(planoNieve);
  } else {
    scene.remove(planoNieve);
  }

  if (btn4) {
    btn4.classList.toggle("active", nieveActiva);
    if (shaderActual === 3) {
      btn4.innerText = nieveActiva
        ? "😠 Calmar Grinch [4]"
        : "❄️ Enfadar Grinch [4]";
    } else {
      btn4.innerText = nieveActiva
        ? "❄️ Quitar Nieve [4]"
        : "❄️ Modo Nieve [4]";
    }
  }
}

function seleccionar(opcion) {
  const btn1 = document.getElementById("btnShader1");
  const btn2 = document.getElementById("btnShader2");
  const btn3 = document.getElementById("btnShader3");

  if (opcion === 1) {
    shaderActual = 1;
    materialActual.fragmentShader = fragmentShader_muneco();
    materialActual.needsUpdate = true;
    if (btn1) btn1.classList.add("active");
    if (btn2) btn2.classList.remove("active");
    if (btn3) btn3.classList.remove("active");
    actualizarEstadoNieve();
  } else if (opcion === 2) {
    shaderActual = 2;
    materialActual.fragmentShader = fragmentShader_arbol();
    materialActual.needsUpdate = true;
    if (btn2) btn2.classList.add("active");
    if (btn1) btn1.classList.remove("active");
    if (btn3) btn3.classList.remove("active");
    actualizarEstadoNieve();
  } else if (opcion === 3) {
    shaderActual = 3;
    materialActual.fragmentShader = fragmentShader_grinch();
    materialActual.needsUpdate = true;
    if (btn3) btn3.classList.add("active");
    if (btn1) btn1.classList.remove("active");
    if (btn2) btn2.classList.remove("active");
    actualizarEstadoNieve();
  } else if (opcion === 4) {
    nieveActiva = !nieveActiva;
    actualizarEstadoNieve();
  }
}

function togglePlay() {
  pausado = !pausado;
  const btn = document.getElementById("btnPlayPause");
  if (btn) btn.innerText = pausado ? "▶ Reanudar" : "⏸ Pausa [Espacio]";
}

function setupEvents() {
  const b1 = document.getElementById("btnShader1");
  const b2 = document.getElementById("btnShader2");
  const b3 = document.getElementById("btnShader3");
  const b4 = document.getElementById("btnShader4");
  const bp = document.getElementById("btnPlayPause");

  if (b1) b1.addEventListener("click", () => seleccionar(1));
  if (b2) b2.addEventListener("click", () => seleccionar(2));
  if (b3) b3.addEventListener("click", () => seleccionar(3));
  if (b4) b4.addEventListener("click", () => seleccionar(4));
  if (bp) bp.addEventListener("click", togglePlay);

  window.addEventListener("keydown", (e) => {
    if (e.key === "1") seleccionar(1);
    if (e.key === "2") seleccionar(2);
    if (e.key === "3") seleccionar(3);
    if (e.key === "4") seleccionar(4);
    if (e.key === " " || e.code === "Space") togglePlay();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    init();
    animationLoop();
  });
} else {
  setupEvents();
  init();
  animationLoop();
}