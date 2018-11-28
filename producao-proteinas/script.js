"use strict";

var stats = new Stats();
var cena = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 2, 3);
var render = new THREE.WebGLRenderer({
    antialias: false
});

render.setSize(window.innerWidth, window.innerHeight);
render.shadowMap.enabled = true;
render.shadowMap.type = THREE.PCFSoftShadowMap;

var canvas = render.domElement;
document.body.appendChild(canvas);

stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

//#region Linha 
var materialLinha = new THREE.LineBasicMaterial({
    color: 0xFFFFFF
});
var geometriaLinha = new THREE.Geometry();

//CURVA SPLINE
var curva = new THREE.CatmullRomCurve3(
    [
        new THREE.Vector3(-1.5, 0, 0),
        new THREE.Vector3(1.5, 1.5, 0),
        new THREE.Vector3(1.2, 0.2, 0),
        new THREE.Vector3(1.4, -0.2, 0),
        new THREE.Vector3(1.5, -1.5, 0),
        new THREE.Vector3(-1.5, -1.5, 0),
        new THREE.Vector3(-0.3, -0.8, 0),
        new THREE.Vector3(-0.9, -0.6, 0),
        new THREE.Vector3(-1.7, -0.9, 0),
        new THREE.Vector3(-2.3, -0.5, 0),
        new THREE.Vector3(-1.5, 0, 0)
    ]
);

var caminho = new THREE.Path(curva.getPoints(260));
var geometriaLinha = caminho.createPointsGeometry(260);
var linha = new THREE.Line(geometriaLinha, materialLinha);
cena.add(linha);

var plane = new THREE.Mesh(
    new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
    new THREE.MeshPhongMaterial({
        color: 0x661600
    }));
plane.position.set(0, 0, -0.06);

cena.add(plane);

//#endregion

//#region Criação do carro

//Funções
function gerarCarro(width = 1, height = 1, depth = 1) {
    var geo = new THREE.BoxGeometry(width, height, depth);
    return geo;
}

//Adicionando o carro na cena
var chasi = new THREE.Mesh(gerarCarro(0.15, 0.3, 0.08), new THREE.MeshPhongMaterial());
chasi.position.set(0, 0, 0);

var teto = new THREE.Mesh(gerarCarro(0.15, 0.15, 0.05), new THREE.MeshPhongMaterial());
teto.position.set(0, 0, 0.05);

//Junção de todas as rodas
var carro = new THREE.Geometry();
chasi.updateMatrix(); // as needed
carro.merge(chasi.geometry, chasi.matrix);
teto.updateMatrix(); // as needed
carro.merge(teto.geometry, teto.matrix);

var carro = new THREE.Mesh(carro, new THREE.MeshPhongMaterial({
    color: 0x4174f4
}));
cena.add(carro);
//#endregion

//#region Criação das Rodas
function gerarRoda(radius = 1, tube = 1, radialSegments = 1, tubularSegments = 1) {
    var geo = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
    return geo;
}

var rodaTras1 = new THREE.Mesh(gerarRoda(0.015, 0.02, 30, 100), new THREE.MeshPhongMaterial());
rodaTras1.position.set(-0.065, 0.08, -0.035);
rodaTras1.rotation.set(1.5, 1.5, 0);

var rodaTras2 = new THREE.Mesh(gerarRoda(0.015, 0.02, 30, 100), new THREE.MeshPhongMaterial());
rodaTras2.position.set(-0.065, -0.08, -0.035);
rodaTras2.rotation.set(1.5, 1.5, 0);

var rodaFrente1 = new THREE.Mesh(gerarRoda(0.015, 0.02, 30, 100), new THREE.MeshPhongMaterial());
rodaFrente1.position.set(0.065, 0.08, -0.035);
rodaFrente1.rotation.set(1.5, 1.5, 0);

var rodaFrente2 = new THREE.Mesh(gerarRoda(0.015, 0.02, 30, 100), new THREE.MeshPhongMaterial());
rodaFrente2.position.set(0.065, -0.08, -0.035);
rodaFrente2.rotation.set(1.5, 1.5, 0);

//Junção de todas as rodas
var rodas = new THREE.Geometry();
rodaFrente1.updateMatrix(); // as needed
rodas.merge(rodaFrente1.geometry, rodaFrente1.matrix);
rodaFrente2.updateMatrix(); // as needed
rodas.merge(rodaFrente2.geometry, rodaFrente2.matrix);
rodaTras1.updateMatrix(); // as needed
rodas.merge(rodaTras1.geometry, rodaTras1.matrix);
rodaTras2.updateMatrix(); // as needed
rodas.merge(rodaTras2.geometry, rodaTras2.matrix);

//Adicionando as rodas na cena
rodas = new THREE.Mesh(rodas, new THREE.MeshPhongMaterial({
    color: 0x383838
}));
cena.add(rodas);
//#endregion Rodas

//#region Movimentação do carro
var count = 0;

function movimentacao() {
    if (count > linha.geometry.vertices.length - 1) {
        count = 0;
    }
    var vertice = linha.geometry.vertices[count];
    carro.position.set(vertice.x, vertice.y, vertice.z);
    carro.geometry.verticesNeedUpdate = true;

    rodas.position.set(vertice.x, vertice.y, vertice.z);
    rodas.geometry.verticesNeedUpdate = true;

    count++;
}
//#endregion

//#region Animação do carro
var up = new THREE.Vector3(0, 1, 0);
var axis = new THREE.Vector3();
var carPosition, whellPosition, radians, axis, tangent;
var t = 0;
var acelaracao = 0.002;

function animacaoCarro() {
    carPosition = curva.getPoint(t);
    whellPosition = curva.getPoint(t);
    carro.position.set(carPosition.x, carPosition.y, carPosition.z);
    rodas.position.set(carPosition.x, carPosition.y, carPosition.z);
    tangent = curva.getTangent(t).normalize();
    axis.crossVectors(up, tangent).normalize();
    radians = Math.acos(up.dot(tangent));
    carro.quaternion.setFromAxisAngle(axis, radians);
    rodas.quaternion.setFromAxisAngle(axis, radians);
    t = (t >= 1) ? 0 : t += acelaracao;
}
//#endregion

//#region Luz e sombra
var luzAmbiente = new THREE.AmbientLight(0x707070, 0.8);
cena.add(luzAmbiente);

var luzPonto = new THREE.PointLight(0xf4d442, 2.0, 100);
luzPonto.position.set(0, 0, 1.5);
luzPonto.castShadow = true;
luzPonto.shadow.camera.near = 0.1;
luzPonto.shadow.camera.far = 25;
luzPonto.shadow.mapSize.height = 1024;
luzPonto.shadow.mapSize.width = 1024;
cena.add(luzPonto);

carro.castShadow = true;
plane.receiveShadow = true;
//#endregion 

//#region Camera
var teclas = [];

for (var i = 0; i < 256; i++) {
    teclas[i] = false;
}

var camera_pivot = new THREE.Object3D();
var Y_AXIS = new THREE.Vector3(0, 1, 0);
var X_AXIS = new THREE.Vector3(1, 0, 0);
var Z_AXIS = new THREE.Vector3(0, 0, 1);

cena.add(camera_pivot);
camera_pivot.add(camera);
camera_pivot.rotation.set(1.5, 0, 0)

camera.lookAt(camera_pivot.position);

function processaTeclas() {
    if (teclas[37]) { //seta esquerda
        camera_pivot.rotateOnAxis(Y_AXIS, -0.008);
    }
    if (teclas[39]) { //seta direita
        camera_pivot.rotateOnAxis(Y_AXIS, 0.008);
    }
    if (teclas[38]) { //seta cima
        camera_pivot.rotateOnAxis(X_AXIS, 0.008);
    }
    if (teclas[40]) { //seta baixo
        camera_pivot.rotateOnAxis(X_AXIS, -0.008);
    }
    if (teclas[65]) { //a
        camera_pivot.rotateOnAxis(Z_AXIS, 0.008);
    }
    if (teclas[83]) { //s
        camera_pivot.rotateOnAxis(Z_AXIS, -0.008);
    }
    if (teclas[90]) { //z
        if (acelaracao < 0.020)
            acelaracao += acelaracao + 0.001;
    }
    if (teclas[88]) { //x
        if (acelaracao > 0.001)
            acelaracao -= acelaracao - 0.001;
    }
}

document.onkeyup = function (evt) {
    teclas[evt.keyCode] = false;
}

document.onkeydown = function (evt) {
    teclas[evt.keyCode] = true;
}
//#endregion

//carro.material.wireframe = true;
//carro.material.side = THREE.DoubleSide;

function desenhar() {
    stats.begin();
    movimentacao();
    processaTeclas();
    animacaoCarro();
    render.render(cena, camera);
    stats.end();
    requestAnimationFrame(desenhar);
}

requestAnimationFrame(desenhar);