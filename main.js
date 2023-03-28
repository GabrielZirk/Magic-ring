import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createNoise3D, createNoise4D } from 'simplex-noise';
import GUI from 'lil-gui';
import { CanvasCapture } from 'canvas-capture';

/**
 * Capturer
 */
var capturer = new CCapture({
  framerate: 40,
  verbose: true,
  format: 'webm',
  display: true,
  name: 'Magic_Ring',
  quality: 100,
});

/**
 * Parameters
 */
const params = {
  numParticles: 100000,
  ringRadius: 2,
  particleSize: 0.03,
  globalnoiseScale: 0.005,
  circleThickness: 0.7,
  noiseScaleX: 1,
  noiseScaleY: 1,
  noiseScaleZ: 1,
  running: true,
  speedFactor: 1,
}

/**
 * Noise
 */
const noise3D = createNoise3D();
const noise4D = createNoise4D();

/**
 * Canvas
 */
const canvas = document.getElementById("magic-circle");

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Handle different pixeldensities
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

/**
 * Orbitcontrols
 */
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(2, 2, 4);
controls.autoRotate = true;
controls.autoRotateSpeed = 4.0;
controls.enableDamping = true;
controls.update();

/**
 * Axishelper
 */
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

/**
 * Particles
 */
const textureLoader = new THREE.TextureLoader();
let particleTexture = textureLoader.load('/static/textures/twirl_01.png');

let particles = null;
let particlesGeometry = null;
let particlesMaterial = null;
let particlesSpeeds = [];

function generateMagicRing() {
  if (particles != null) {
    scene.remove(particles);
    particlesGeometry.dispose();
    particlesMaterial.dispose();
  }
  let vertices = [];


  for (let i = 0; i < params.numParticles; i++) {
    let i3 = i * 3;
    let randomAngle = THREE.MathUtils.mapLinear(Math.random(), 0, 1, 0, Math.PI * 2);
    let randomRadius = params.ringRadius * THREE.MathUtils.mapLinear(Math.random(), 0, 1, params.circleThickness, 1)

    vertices[i3 + 0] = randomRadius * Math.sin(randomAngle);
    vertices[i3 + 1] = randomRadius * Math.cos(randomAngle);
    vertices[i3 + 2] = Math.random();
    particlesSpeeds.push(Math.random() * 0.01);
  };

  particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: params.particleSize,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: true,
    transparent: true,
    alphaMap: particleTexture,

  });
  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);
}
generateMagicRing();
/**
 * GUI
 */
const gui = new GUI();
gui.add(params, 'numParticles').min(100).max(200000).step(10000).name("Particle number").onFinishChange(generateMagicRing);
gui.add(params, 'ringRadius').min(1).max(10).step(1).name("Ring radius").onFinishChange(generateMagicRing);
gui.add(params, 'particleSize').min(0.005).max(0.1).step(0.001).name("Particle size").onFinishChange(generateMagicRing);
gui.add(params, 'globalnoiseScale').min(0.0001).max(0.05).step(0.001).name("Global Noise scale").onFinishChange(generateMagicRing);
gui.add(params, 'circleThickness').min(0.1).max(1).step(0.1).name("Circle thickness").onFinishChange(generateMagicRing);
gui.add(params, 'noiseScaleX').min(0.1).max(10).step(0.5).name("Noise scale x").onFinishChange(generateMagicRing);
gui.add(params, 'noiseScaleY').min(0.1).max(10).step(0.5).name("Noise scale Y").onFinishChange(generateMagicRing);
gui.add(params, 'noiseScaleZ').min(0.1).max(10).step(0.5).name("Noise scale Z").onFinishChange(generateMagicRing);
gui.add(controls, 'autoRotateSpeed').min(0).max(10).step(0.5).name("Autorotate speed");
gui.add(params, 'speedFactor').min(0.1).max(10).step(0.5).name("Speed factor");
gui.add(particlesMaterial, 'depthWrite').name("Depth write");
gui.add(particlesMaterial, 'blending').min(0).max(5).step(1).name("Blending")

function animate() {

  controls.update();
  renderer.render(scene, camera);

  let vertices = [];
  let prevPositions = particles.geometry.attributes.position.array;

  for (let i = 0; i < params.numParticles; i++) {
    let i3 = i * 3;

    // Noise
    let noise = noise3D(prevPositions[i3 + 0] / params.noiseScaleX, prevPositions[i3 + 1] / params.noiseScaleY, prevPositions[i3 + 2] / params.noiseScaleZ) * params.globalnoiseScale;
    // let noise = noise4D(prevPositions[i3 + 0], prevPositions[i3 + 1], prevPositions[i3 + 2], Math.random()) * params.globalnoiseScale

    let prevAngle = Math.atan2(prevPositions[i3 + 0], prevPositions[i3 + 1]);
    let particleRadius = Math.sqrt(Math.pow(prevPositions[i3 + 0], 2) + Math.pow(prevPositions[i3 + 1], 2))
    vertices[i3 + 0] = particleRadius * Math.sin(prevAngle + particlesSpeeds[i] * params.speedFactor) + noise;
    vertices[i3 + 1] = particleRadius * Math.cos(prevAngle + particlesSpeeds[i] * params.speedFactor) + noise;
    vertices[i3 + 2] = prevPositions[i3 + 2] + noise * 1.5;
  };

  particles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  particles.geometry.attributes.position.needsUpdate = true;

  window.requestAnimationFrame(animate);
  capturer.capture(canvas);
};
animate();


/**
 * Helper functions
 */

// Handle window resizing
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

document.body.addEventListener("keydown", function (e) {
  if (e.key == " " ||
    e.code == "Space" ||
    e.keyCode == 32
  ) {
    capturer.stop();
    capturer.save();
  }
});

document.body.addEventListener("keydown", function (e) {
  if (e.key == "s" ||
    e.code == "KeyS") {
    capturer.start()
  }
});