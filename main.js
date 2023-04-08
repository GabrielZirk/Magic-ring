import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createNoise3D, createNoise4D } from 'simplex-noise';
import GUI from 'lil-gui';
import { CanvasCapture } from 'canvas-capture';

/**
 * Capturer
 */
CanvasCapture.init(
  document.querySelector('canvas.webgl'),
  { showRecDot: true }, // Options are optional, more info below.
);
CanvasCapture.bindKeyToVideoRecord('v', {
  format: 'webm', // Options are optional, more info below.
  fps: 60,
  name: 'myVideo',
  quality: 1.0,
});

/**
 * Parameters
 */
const params = {
  numParticles: 70000,
  ringRadius: 1,
  particleSize: 0.1,
  globalnoiseScale: 0.001,
  circleThickness: 0.6,
  noiseScaleX: 1,
  noiseScaleY: 1,
  noiseScaleZ: 1,
  speedFactor: 1,
  depthWrite: true,
  zNoiseFactor: 1.0,
  knot: true,
  p: 3,
  q: 2,
  spreadScale: 1,
  knotOuterRad: 2,
  knotInnerRad: 1,

  width: 1080,
  heigt: 1350,
}

// const params = {
//   numParticles: 100000,
//   ringRadius: 2,
//   particleSize: 0.03,
//   globalnoiseScale: 0.005,
//   circleThickness: 0.7,
//   noiseScaleX: 1,
//   noiseScaleY: 1,
//   noiseScaleZ: 1,
//   speedFactor: 1,
//   zNoiseFactor: 1.5
// }

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
/*
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});

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
camera.position.set(0, 1, 8);
controls.autoRotate = false;
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
let angles = [];
let randomX = [];
let randomY = [];
let randomZ = [];
let colors = [];

function generateMagicRing() {
  if (particles != null) {
    scene.remove(particles);
    particlesGeometry.dispose();
    particlesMaterial.dispose();
  }
  let vertices = [];

  if (!params.knot) {
  for (let i = 0; i < params.numParticles; i++) {
    let i3 = i * 3;
    let randomAngle = THREE.MathUtils.mapLinear(Math.random(), 0, 1, 0, Math.PI * 2);
    let randomRadius = params.ringRadius * THREE.MathUtils.mapLinear(Math.random(), 0, 1, params.circleThickness, 1)

    vertices[i3 + 0] = randomRadius * Math.sin(randomAngle);
    vertices[i3 + 1] = randomRadius * Math.cos(randomAngle);
    vertices[i3 + 2] = Math.random();
    particlesSpeeds.push(Math.random() * 0.01);
    
  };}

  else {
    for (let i = 0; i < params.numParticles; i++) {
      let i3 = i * 3;
      let randomAngle = THREE.MathUtils.mapLinear(Math.random(), 0, 1, 0, Math.PI * 2);
      angles.push(randomAngle);
      let radius = (2 + Math.cos(params.p * randomAngle ));
      let randX = Math.random() * params.spreadScale;
      randomX.push(randX);
      let randY = Math.random() * params.spreadScale;
      randomY.push(randY);
      let randZ = Math.random() * params.spreadScale;
      randomZ.push(randZ);

      vertices[i3 + 0] = radius * Math.cos(params.q * randomAngle) + randX;
      vertices[i3 + 1] = radius * Math.sin(params.q * randomAngle) + randY;
      vertices[i3 + 2] = Math.sin(params.p * randomAngle) + randZ;
      particlesSpeeds.push(Math.random() * 0.01);
      
    };}
  
  particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  particlesMaterial = new THREE.PointsMaterial({
    // color: '0xffffff',
    size: params.particleSize,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: params.depthWrite,
    transparent: true,
    alphaMap: particleTexture,
    vertexColors: true,
    depthTest: true

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
gui.add(params, 'globalnoiseScale').min(0.0001).max(1).step(0.001).name("Global Noise scale")
gui.add(params, 'circleThickness').min(0.1).max(1).step(0.1).name("Circle thickness").onFinishChange(generateMagicRing);
gui.add(params, 'noiseScaleX').min(0.1).max(10).step(0.5).name("Noise scale x").onFinishChange(generateMagicRing);
gui.add(params, 'noiseScaleY').min(0.1).max(10).step(0.5).name("Noise scale Y").onFinishChange(generateMagicRing);
gui.add(params, 'noiseScaleZ').min(0.1).max(10).step(0.5).name("Noise scale Z").onFinishChange(generateMagicRing);
gui.add(controls, 'autoRotateSpeed').min(0).max(10).step(0.5).name("Autorotate speed").onFinishChange(generateMagicRing);;
gui.add(params, 'speedFactor').min(0.1).max(10).step(0.5).name("Speed factor").onFinishChange(generateMagicRing);
gui.add(params, 'depthWrite').name("Depth write").onFinishChange(generateMagicRing);
gui.add(params, "zNoiseFactor").min(0.1).max(10).step(0.5).name("z Noise factor").onFinishChange(generateMagicRing);
gui.add(params, 'q').min(1).max(10).step(1).name("q").onFinishChange(generateMagicRing);
gui.add(params, 'p').min(1).max(10).step(1).name("p").onFinishChange(generateMagicRing);
gui.add(params, "spreadScale").min(0.1).max(2).step(0.1).name("Spread scale").onFinishChange(generateMagicRing);
gui.add(params, "knotOuterRad").min(1).max(3).step(1).name("Knot outer radius").onFinishChange(generateMagicRing);
gui.add(params, "knotInnerRad").min(0.1).max(2).step(0.1).name("Knot inner radius").onFinishChange(generateMagicRing);

function animate() {

  controls.update();
  renderer.render(scene, camera);

  let vertices = [];
  let prevPositions = particles.geometry.attributes.position.array;
  for (let i = 0; i < params.numParticles; i++) {
    let i3 = i * 3;

    // Noise
    let noise = noise3D(prevPositions[i3 + 0] / params.noiseScaleX, prevPositions[i3 + 1] / params.noiseScaleY, prevPositions[i3 + 2] / params.noiseScaleZ) * params.globalnoiseScale;
    // let noise = noise4D(prevPositions[i3 + 0], prevPositions[i3 + 1], prevPositions[i3 + 2], performance.now()) * params.globalnoiseScale
    let prevAngle = Math.atan2(prevPositions[i3 + 0], prevPositions[i3 + 1]);
    let particleRadius = Math.sqrt(Math.pow(prevPositions[i3 + 0], 2) + Math.pow(prevPositions[i3 + 1], 2));
    if (!params.knot) {

    vertices[i3 + 0] = particleRadius * Math.sin(prevAngle + particlesSpeeds[i] * params.speedFactor) + noise;
    vertices[i3 + 1] = particleRadius * Math.cos(prevAngle + particlesSpeeds[i] * params.speedFactor) + noise;
    vertices[i3 + 2] = prevPositions[i3 + 2] + noise * params.zNoiseFactor;
    } 

    else {
      let oldAngle = angles[i];

      let noise = noise3D(randomX[i], randomY[i], randomZ[i]);
      noise *= params.globalnoiseScale;
      let newAngle = (oldAngle + 0.002) % (Math.PI * 2);
      angles[i] = newAngle;

      let radius = (params.knotOuterRad + params.knotInnerRad *Math.cos(params.p * newAngle));
      vertices[i3 + 0] = (radius * Math.cos(params.q * newAngle )) + randomX[i] * params.spreadScale + noise;
      vertices[i3 + 1] = (radius * Math.sin(params.q * newAngle )) + randomY[i] * params.spreadScale + noise;
      vertices[i3 + 2] = Math.sin(params.p * newAngle ) + randomZ[i] * params.spreadScale + noise;
      
      let color = new THREE.Color();
      let hue = THREE.MathUtils.mapLinear(newAngle, 0, Math.PI * 2, 0.3, 0.9);
      color.setHSL(hue, 1, 0.5);
      colors[i3 + 0] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
     }
  };
  particles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  particles.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  particles.geometry.attributes.position.needsUpdate = true;


  window.requestAnimationFrame(animate);
  CanvasCapture.checkHotkeys();

  // You need to call recordFrame() only if you are recording
  // a video, gif, or frames.
  if (CanvasCapture.isRecording()) CanvasCapture.recordFrame();

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

function calcPolarfromCartCoords(x, y, z) {
  let r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
  let theta = Math.acos(z / r);
  let phi = Math.atan2(y, x);
  return {
      "radius": r,
      "theta": theta,
      "phi": phi
  }
}

function calcCartCoordsFromPolar(r, theta, phi) {
  let x = r * Math.sin(theta) * Math.cos(phi);
  let y = r * Math.sin(theta) * Math.sin(phi);
  let z = r * Math.cos(theta);

  return {
      "newX": x,
      "newY": y,
      "newZ": z
  }
}