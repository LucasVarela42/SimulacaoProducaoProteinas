"use strict";
//instancias
var stats = new Stats();
var cena = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
var render = new THREE.WebGLRenderer({
    antialias: false
});
var loader = new THREE.PDBLoader();
var offset = new THREE.Vector3();
var labelRenderer = new THREE.CSS2DRenderer();

var controls = new THREE.OrbitControls(camera);
var teclas = [];
var objetos;
var raycaster;
var mouse;
var intersects;
var vel = 0.000001;
var direcao;
var directionVector;
var root;
//#region Init
function init() {
    //Posição da camera
    camera.position.set(0, 0, 45);
    camera.up.set(0, 0, 0);
    camera.lookAt(cena.position);

    //tamanho do render e sombra
    render.setSize(window.innerWidth, window.innerHeight);
    render.shadowMap.enabled = true;
    render.shadowMap.type = THREE.PCFSoftShadowMap;

    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    //listener para redimencionamento
    window.addEventListener('resize', onWindowResize, false);

    //função para redimencionar
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        render.setSize(window.innerWidth, window.innerHeight);
    }

    //carregar canvas no body
    var canvas = render.domElement;
    document.body.appendChild(canvas);

    //estatistica do fps
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    //criação do Object3D
    objetos = new THREE.Object3D();
    cena.add(objetos);

    root = new THREE.Group();
    cena.add(root);

    carregarMolecula('models/caffeine.pdb');

    //chamada da função desenhar
    desenhar();
}
//#endregion

//#region Chão
var plane = new THREE.Mesh(
    new THREE.PlaneGeometry(window.innerWidth, 5),
    new THREE.MeshPhongMaterial({
        color: 0x661600
    }));
plane.position.set(0, 0, -1);
cena.add(plane);
//#endregion

//#region Carregar formas
function gerarCubo(width = 1, height = 1, depth = 1) {
    var geo = new THREE.BoxGeometry(width, height, depth);
    return geo;
}
var cube = new THREE.Mesh(gerarCubo(1, 1, 1), new THREE.MeshPhongMaterial());
cube.position.set(-2, 0, 0);
cena.add(cube);

var cube2 = new THREE.Mesh(gerarCubo(1, 1, 1), new THREE.MeshPhongMaterial());
cube2.position.set(2, 0, 0);
cena.add(cube2);

//Carregar modelos
function carregarMolecula(url) {
    loader.load(url, function (pdb) {
        var geometryAtoms = pdb.geometryAtoms;
        var geometryBonds = pdb.geometryBonds;
        var json = pdb.json;

        var boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
        var sphereGeometry = new THREE.IcosahedronBufferGeometry(1, 2);
        geometryAtoms.computeBoundingBox();
        geometryAtoms.boundingBox.getCenter(offset).negate();
        geometryAtoms.translate(offset.x, offset.y, offset.z);
        geometryBonds.translate(offset.x, offset.y, offset.z);
        var positions = geometryAtoms.getAttribute('position');
        var colors = geometryAtoms.getAttribute('color');
        var position = new THREE.Vector3();
        var color = new THREE.Color();
        for (var i = 0; i < positions.count; i++) {
            position.x = positions.getX(i);
            position.y = positions.getY(i);
            position.z = positions.getZ(i);
            color.r = colors.getX(i);
            color.g = colors.getY(i);
            color.b = colors.getZ(i);
            var material = new THREE.MeshPhongMaterial({
                color: color
            });
            var object = new THREE.Mesh(sphereGeometry, material);
            object.position.copy(position);
            object.position.multiplyScalar(3);
            object.scale.multiplyScalar(2);
            root.add(object);
            var atom = json.atoms[i];
            var text = document.createElement('div');
            text.className = 'label';
            text.style.color = 'rgb(' + atom[3][0] + ',' + atom[3][1] + ',' + atom[3][2] + ')';
            text.textContent = atom[4];
            var label = new THREE.CSS2DObject(text);
            label.position.copy(object.position);
            root.add(label);
        }
        positions = geometryBonds.getAttribute('position');
        var start = new THREE.Vector3();
        var end = new THREE.Vector3();
        for (var i = 0; i < positions.count; i += 2) {
            start.x = positions.getX(i);
            start.y = positions.getY(i);
            start.z = positions.getZ(i);
            end.x = positions.getX(i + 1);
            end.y = positions.getY(i + 1);
            end.z = positions.getZ(i + 1);
            start.multiplyScalar(75);
            end.multiplyScalar(75);
            var object = new THREE.Mesh(boxGeometry, new THREE.MeshPhongMaterial(0xffffff));
            object.position.copy(start);
            object.position.lerp(end, 0.5);
            object.scale.set(0, 0, start.distanceTo(end));
            object.lookAt(end);
            root.add(object);
        }
    });
}
//#endregion

//#region Luz e sombra
var luzAmbiente = new THREE.AmbientLight(0x707070, 0.8);
cena.add(luzAmbiente);

var luzPonto = new THREE.PointLight(0xf4d442, 2.0, 100);
luzPonto.position.set(0, 1, 5);
luzPonto.castShadow = true;
luzPonto.shadow.camera.near = 0.1;
luzPonto.shadow.camera.far = 25;
luzPonto.shadow.mapSize.height = 1024;
luzPonto.shadow.mapSize.width = 1024;
cena.add(luzPonto);

//carregar sombras nos objetos
cube.castShadow = true;
cube2.castShadow = true;
plane.receiveShadow = true;
//#endregion 

//#region Teclas
function processaTeclas() {
    var vel = 0.1
    if (teclas[37]) { //seta esquerda
        cube.position.x -= vel;
    }
    if (teclas[39]) { //seta direita
        cube.position.x += vel;
    }
    if (teclas[38]) { //seta cima
        cube.position.z -= vel;
    }
    if (teclas[40]) { //seta baixo
        cube.position.z += vel;
    }
}
document.onkeyup = function (evt) {
    teclas[evt.keyCode] = false;
}

document.onkeydown = function (evt) {
    teclas[evt.keyCode] = true;
}
//#endregion

//#region Colisão de objetos
function raycast() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    render.domElement.addEventListener('click', identificar, false);
}

function identificar(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects(objetos.children);
    cube = intersects[0].object;
    //checkObjectCollisions(objetos.children[0]);
    //this.teclado(cube1);
    var objetoFilho = objetos.children.length;
    for (var i = 0; i < objetoFilho; i++) {
        //    intersects[i].object.material.color.set(0xff0000);
        //var vertices = objetoFilho[0].geometry.vertices[vertexIndex].clone();
        verificandoColisoes(objetos.children[i]);
    }
}

function verificandoColisoes(mesh) {
    for (var v = 0; v < mesh.geometry.vertices.length; v++) {
        var vertices = mesh.geometry.vertices[v].clone();
        var globalVertex = vertices.applyMatrix4(mesh.matrix);
        directionVector = globalVertex.sub(mesh.position);
        var ray = new THREE.Raycaster(mesh.position, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(objetos.children);
        console.log(collisionResults);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            cube.position.x = -1;
        }
    }
}

function handleObjectsCollision(meshA, collisionResult) {
    var meshB = collisionResult.object;
    //console.log("Objects Collided");
    if (meshA === meshB)
        console.log("Appears to be same object");
    var avX = (meshA.velocity.x * (meshA.mass - meshB.mass) + (2 * meshB.mass * meshB.velocity.x)) / (meshA.mass + meshB.mass);
    var avY = (meshA.velocity.y * (meshA.mass - meshB.mass) + (2 * meshB.mass * meshB.velocity.y)) / (meshA.mass + meshB.mass);
    var avZ = (meshA.velocity.z * (meshA.mass - meshB.mass) + (2 * meshB.mass * meshB.velocity.z)) / (meshA.mass + meshB.mass);
    var bvX = (meshB.velocity.x * (meshB.mass - meshA.mass) + (2 * meshA.mass * meshA.velocity.x)) / (meshA.mass + meshB.mass);
    var bvY = (meshB.velocity.y * (meshB.mass - meshA.mass) + (2 * meshA.mass * meshA.velocity.y)) / (meshA.mass + meshB.mass);
    var bvZ = (meshB.velocity.z * (meshB.mass - meshA.mass) + (2 * meshA.mass * meshA.velocity.z)) / (meshA.mass + meshB.mass);
    meshA.velocity.set(avX, avY, avZ);
    meshB.velocity.set(bvX, bvY, bvZ);
}
//#endregion


function desenhar() {
    stats.begin();
    raycast();
    processaTeclas();
    render.render(cena, camera);
    stats.end();
    requestAnimationFrame(desenhar);
}

window.onload = init();