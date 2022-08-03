import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/renderers/CSS2DRenderer';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 2000);
camera.position.set(0.5, 0.5, 1).setLength(14);
let renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0xede6dd);
document.getElementById("container").appendChild(renderer.domElement);

let labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '1vh';
labelRenderer.domElement.style.right = '1vw';
// labelRenderer.domElement.style.width = '65vw'
document.getElementById("container").appendChild( labelRenderer.domElement);

window.addEventListener("resize", onWindowResize);

let controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 15;
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed *= 0.3;

let globalUniforms = {
  time: { value: 0 }
};

// <GLOBE>
// https://web.archive.org/web/20120107030109/http://cgafaq.info/wiki/Evenly_distributed_points_on_sphere#Spirals
let counter = 200000;
let rad = 5;
let sph = new THREE.Spherical();

let r = 0;
let dlong = Math.PI * (3 - Math.sqrt(5));
let dz = 2 / counter;
let long = 0;
let z = 1 - dz / 2;

let pts = [];
let clr = [];
let c = new THREE.Color();
let uvs = [];

for (let i = 0; i < counter; i++) {
	r = Math.sqrt(1 - z * z);
	let p = new THREE.Vector3(
		Math.cos(long) * r,
		z,
		-Math.sin(long) * r
	).multiplyScalar(rad);
	pts.push(p);
	z = z - dz;
	long = long + dlong;

	c.setHSL(0.45, 0.5, Math.random() * 0.25 + 0.25);
	c.toArray(clr, i * 3);

	sph.setFromVector3(p);
	uvs.push((sph.theta + Math.PI) / (Math.PI * 2), 1.0 - sph.phi / Math.PI);
}

let g = new THREE.BufferGeometry().setFromPoints(pts);
g.setAttribute("color", new THREE.Float32BufferAttribute(clr, 3));
g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
let m = new THREE.PointsMaterial({
  size: 0.1,
  vertexColors: true,
  onBeforeCompile: (shader) => {
    shader.uniforms.globeTexture = {
      value: new THREE.TextureLoader().load(imgData)
    };
    shader.vertexShader = `
    	uniform sampler2D globeTexture;
      varying float vVisibility;
      varying vec3 vNormal;
      varying vec3 vMvPosition;
      ${shader.vertexShader}
    `.replace(
      `gl_PointSize = size;`,
      `
      	vVisibility = texture(globeTexture, uv).g; // get value from texture
        gl_PointSize = size * (vVisibility < 0.5 ? 1. : 0.75); // size depends on the value
        vNormal = normalMatrix * normalize(position);
        vMvPosition = -mvPosition.xyz;
        gl_PointSize *= 0.4 + (dot(normalize(vMvPosition), vNormal) * 0.6); // size depends position in camera space
      `
    );
    //console.log(shader.vertexShader);
    shader.fragmentShader = `
    	varying float vVisibility;
      varying vec3 vNormal;
      varying vec3 vMvPosition;
      ${shader.fragmentShader}
    `.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `
      	bool circ = length(gl_PointCoord - 0.5) > 0.5; // make points round
        bool vis = dot(vMvPosition, vNormal) < 0.; // visible only on the front side of the sphere
      	if (circ || vis) discard;
        
        vec3 col = diffuse + (vVisibility > 0.5 ? 0.5 : 0.); // make oceans brighter
        
        vec4 diffuseColor = vec4( col, opacity );
      `
    );
    //console.log(shader.fragmentShader);
  }
});
let globe = new THREE.Points(g, m);
scene.add(globe);
// Coloring in the globe

// </GLOBE>

// <Markers>

// bring in all the JSON files and store into an variable
var xhReq = new XMLHttpRequest();
xhReq.open("GET", 'year.json', false);
xhReq.send(null);
var years = JSON.parse(xhReq.responseText);

var xhReq = new XMLHttpRequest();
xhReq.open("GET", 'titles.json', false);
xhReq.send(null);
var titles = JSON.parse(xhReq.responseText);

var xhReq = new XMLHttpRequest();
xhReq.open("GET", 'text.json', false);
xhReq.send(null);
var bodyparagraphs = JSON.parse(xhReq.responseText);

var xhReq = new XMLHttpRequest();
xhReq.open("GET", 'coord.json', false);
xhReq.send(null);
var coordinates = JSON.parse(xhReq.responseText);

var xhReq = new XMLHttpRequest();
xhReq.open("GET", 'urls.json', false);
xhReq.send(null);
var urls = JSON.parse(xhReq.responseText);

var count = Object.keys(coordinates).length;

const markerCount = count;
let markerInfo = []; // information on markers
let gMarker = new THREE.PlaneGeometry();
let mMarker = new THREE.MeshBasicMaterial({
  color: 0xff3232,
  onBeforeCompile: (shader) => {
    shader.uniforms.time = globalUniforms.time;
    shader.vertexShader = `
    	attribute float phase;
      varying float vPhase;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
      	vPhase = phase; // de-synch of ripples
      `
    );
    //console.log(shader.vertexShader);
    shader.fragmentShader = `
    	uniform float time;
      varying float vPhase;
    	${shader.fragmentShader}
    `.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `
      vec2 lUv = (vUv - 0.5) * 2.;
      float val = 0.;
      float lenUv = length(lUv);
      val = max(val, 1. - step(0.25, lenUv)); // central circle
      val = max(val, step(0.4, lenUv) - step(0.5, lenUv)); // outer circle
      
      float tShift = fract(time * 0.5 + vPhase);
      val = max(val, step(0.4 + (tShift * 0.6), lenUv) - step(0.5 + (tShift * 0.5), lenUv)); // ripple
      
      if (val < 0.5) discard;
      
      vec4 diffuseColor = vec4( diffuse, opacity );`
    );
    //console.log(shader.fragmentShader)
  }
});
mMarker.defines = { USE_UV: " " }; // needed to be set to be able to work with UVs
let markers = new THREE.InstancedMesh(gMarker, mMarker, markerCount);

let dummy = new THREE.Object3D();
let phase = [];

// Turning longitude and latitude into vector3 coordinates
function convert(lat, lon){
  var phi_rad = lat * Math.PI/180;
  var theta_rad = lon * Math.PI/180;


  return[phi_rad, theta_rad]
}

for (let i = 0; i < markerCount; i++) {

	var coordinate = coordinates[i.toString()].split(', ')
	var lat = coordinate[0]
	var lon = coordinate[1]

	let coords = convert(lat, lon);
	dummy.position.setFromSphericalCoords(rad + 0.05, Math.PI/2 - coords[0], coords[1]);
	dummy.lookAt(dummy.position.clone().setLength(rad + 1));
	dummy.updateMatrix();
	markers.setMatrixAt(i, dummy.matrix);
	phase.push(Math.random());
	

	markerInfo.push({
		year: years[i],
		title: titles[i],
		event: bodyparagraphs[i],
		sphere: {'lat': parseFloat(lat), 'lon': parseFloat(lon)},
		url: urls[i],
		cartesian: dummy.position.clone()
	});
}

gMarker.setAttribute(
  "phase",
  new THREE.InstancedBufferAttribute(new Float32Array(phase), 1)
);

scene.add(markers);
// </Markers>

// <Label>
let labelDiv = document.getElementById("markerLabel");
let closeBtn = document.getElementById("closeButton");
closeBtn.addEventListener("pointerdown", event => {
  labelDiv.classList.add("hidden");
  mMarker.color.setHex(0xff3232);
  controls.autoRotate = true;
})
let label = new CSS2DObject(labelDiv);
label.userData = {
  cNormal: new THREE.Vector3(),
  cPosition: new THREE.Vector3(),
  mat4: new THREE.Matrix4(),
  trackVisibility: () => { // the closer to the edge, the less opacity
    let ud = label.userData;
    ud.cNormal.copy(label.position).normalize().applyMatrix3(globe.normalMatrix);
    ud.cPosition.copy(label.position).applyMatrix4(ud.mat4.multiplyMatrices(camera.matrixWorldInverse, globe.matrixWorld));
    let d = ud.cPosition.negate().normalize().dot(ud.cNormal);
    d = smoothstep(0.2, 0.7, d);
    label.element.style.opacity = d;
    
    // https://github.com/gre/smoothstep/blob/master/index.js
    function smoothstep (min, max, value) {
      var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
      return x*x*(3 - 2*x);
    };
  }
}
scene.add(label);
// </Label>

// <Interaction>
let pointer = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let intersections;
let divYear = document.getElementById("year");
let divTitle = document.getElementById("title");
let divBody = document.getElementById("bodyparagraph");
let divCrd = document.getElementById("coordinates");
let divURL = document.getElementById("urls")

window.addEventListener("pointerdown", event => {
  	pointer.x = ( event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	raycaster.setFromCamera(pointer, camera);
	intersections = raycaster.intersectObject(markers).filter(m => {
		return (m.uv.subScalar(0.5).length() * 2) < 0.25; // check, if we're in the central circle only
	});
	//console.log(intersections);
	if (intersections.length > 0) {
		let iid = intersections[0].instanceId;
		let mi = markerInfo[iid];
		controls.autoRotate = false;
		mMarker.color.setHex(0xFFD700);

		divYear.innerHTML = `<h3>Year: <b>${mi.year}</b></h3>`;
		divTitle.innerHTML = `<h3>${mi.title}</h3>`;
		divBody.innerHTML = `<b>${mi.event}</b>`;
		divCrd.innerHTML = `<h1>Latitude:</h1> <b>${mi.sphere.lat.toFixed(5)}</b> <br> <h1>Longtitude:</h1> <b>${mi.sphere.lon.toFixed(5)}</b>`
		divURL.innerHTML = `<a href = ${mi.url} target = "_blank""> Wiki Link </a>`


		label.position.copy(mi.cartesian);	
		label.element.classList.remove("hidden");
		divURL.addEventListener('pointerdown', () => {window.open(mi.url)})
	}
	
})
// </Interaction>

let clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  let t = clock.getElapsedTime();
  globalUniforms.time.value = t;
  label.userData.trackVisibility();
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});

function onWindowResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
}