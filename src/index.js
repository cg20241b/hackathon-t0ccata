import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

// Init
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// WebGL renderer
const webglRenderer = new THREE.WebGLRenderer();
webglRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(webglRenderer.domElement);

// Shaders for letters
const textShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    lightSource: { value: new THREE.Vector3(0, 0, 0) },
    textColor: { value: new THREE.Vector3(0.75, 0.75, 0.75) },
    ambientStrength: { value: 0.938 },
    viewerPosition: { value: new THREE.Vector3() },
  },
  vertexShader: `
    varying vec3 transformedNormal;
    varying vec3 transformedPosition;

    void main() {
      transformedNormal = normalize(normalMatrix * normal);
      transformedPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 lightSource;
    uniform vec3 textColor;
    uniform float ambientStrength;
    uniform vec3 viewerPosition;

    varying vec3 transformedNormal;
    varying vec3 transformedPosition;

    void main() {
      vec3 ambientLight = textColor * ambientStrength;
      vec3 lightDir = normalize(lightSource - transformedPosition);
      float diffuseStrength = max(dot(transformedNormal, lightDir), 0.0);
      vec3 diffuseLight = diffuseStrength * textColor;

      vec3 viewDir = normalize(viewerPosition - transformedPosition);
      vec3 reflectDir = normalize(lightDir + viewDir);
      float specularStrength = pow(max(dot(transformedNormal, reflectDir), 0.0), 32.0);
      vec3 specularLight = vec3(0.5) * specularStrength;

      gl_FragColor = vec4(ambientLight + diffuseLight + specularLight, 1.0);
    }
  `,
});

// Shaders for numbers
const numberShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    lightSource: { value: new THREE.Vector3(0, 0, 0) },
    numberColor: { value: new THREE.Vector3(0.0, 0.5, 0.5) },
    ambientStrength: { value: 0.938 },
    viewerPosition: { value: new THREE.Vector3() },
  },
  vertexShader: `
    varying vec3 transformedNormal;
    varying vec3 transformedPosition;

    void main() {
      transformedNormal = normalize(normalMatrix * normal);
      transformedPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 lightSource;
    uniform vec3 numberColor;
    uniform float ambientStrength;
    uniform vec3 viewerPosition;

    varying vec3 transformedNormal;
    varying vec3 transformedPosition;

    void main() {
      vec3 ambientLight = numberColor * ambientStrength;
      vec3 lightDir = normalize(lightSource - transformedPosition);
      float diffuseStrength = max(dot(transformedNormal, lightDir), 0.0);
      vec3 diffuseLight = diffuseStrength * numberColor;

      vec3 viewDir = normalize(viewerPosition - transformedPosition);
      vec3 reflectDir = normalize(lightDir + viewDir);
      float specularStrength = pow(max(dot(transformedNormal, reflectDir), 0.0), 64.0);
      vec3 specularLight = numberColor * specularStrength;

      gl_FragColor = vec4(ambientLight + diffuseLight + specularLight, 1.0);
    }
  `,
});

// Cube material
const cubeShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    glowIntensity: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
  },
  vertexShader: `
    varying vec3 modelPosition;

    void main() {
      modelPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 glowIntensity;
    varying vec3 modelPosition;

    void main() {
      float distanceFromCenter = length(modelPosition);
      float glowEffect = 1.0 - distanceFromCenter * 2.0;
      glowEffect = clamp(glowEffect, 0.0, 1.0);
      gl_FragColor = vec4(glowIntensity * glowEffect, 1.0);
    }
  `,
});

const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const glowingCube = new THREE.Mesh(cubeGeometry, cubeShaderMaterial);
scene.add(glowingCube);
camera.position.z = 5;

// Font loading
const fontLoader = new FontLoader();
const fontUrl =
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json";

fontLoader.load(fontUrl, function (loadedFont) {
  const textGeo = new TextGeometry("Z", {
    font: loadedFont,
    size: 1,
    height: 0.2,
  });
  const textMesh = new THREE.Mesh(textGeo, textShaderMaterial);
  textMesh.position.x = -2;
  scene.add(textMesh);

  const numberGeo = new TextGeometry("8", {
    font: loadedFont,
    size: 1,
    height: 0.2,
  });
  const numberMesh = new THREE.Mesh(numberGeo, numberShaderMaterial);
  numberMesh.position.x = 2;
  scene.add(numberMesh);
});

// Keyboard tracking
const keyPressState = {};
document.addEventListener("keydown", (e) => (keyPressState[e.key] = true));
document.addEventListener("keyup", (e) => (keyPressState[e.key] = false));

// Animation loop
function animateScene() {
  requestAnimationFrame(animateScene);

  if (keyPressState["w"]) glowingCube.position.y += 0.05;
  if (keyPressState["s"]) glowingCube.position.y -= 0.05;
  if (keyPressState["a"]) camera.position.x -= 0.05;
  if (keyPressState["d"]) camera.position.x += 0.05;

  textShaderMaterial.uniforms.lightSource.value.copy(glowingCube.position);
  numberShaderMaterial.uniforms.lightSource.value.copy(glowingCube.position);
  textShaderMaterial.uniforms.viewerPosition.value.copy(camera.position);
  numberShaderMaterial.uniforms.viewerPosition.value.copy(camera.position);

  webglRenderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  webglRenderer.setSize(window.innerWidth, window.innerHeight);
});

animateScene();
