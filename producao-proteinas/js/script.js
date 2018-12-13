"use strict";
//instancias
var stats = new Stats();
var cena = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 5000);
var render = new THREE.WebGLRenderer({
    antialias: true
});
var loader = new THREE.PDBLoader();
var labelRenderer = new THREE.CSS2DRenderer();
var menu;
var MOLECULES = {
    "Ethanol": "ethanol.pdb",
    "Aspirin": "aspirin.pdb",
    "Caffeine": "caffeine.pdb",
    "Nicotine": "nicotine.pdb",
    "LSD": "lsd.pdb",
    "Cocaine": "cocaine.pdb",
    "Cholesterol": "cholesterol.pdb",
    "Lycopene": "lycopene.pdb",
    "Glucose": "glucose.pdb",
    "Aluminium oxide": "Al2O3.pdb",
    "Cubane": "cubane.pdb",
    "Copper": "cu.pdb",
    "Fluorite": "caf2.pdb",
    "Salt": "nacl.pdb",
    "YBCO superconductor": "ybco.pdb",
    "Buckyball": "buckyball.pdb",
    "Graphite": "graphite.pdb"
};

var teclas = [];
var controls = new THREE.TrackballControls(camera);
var dragControls;

// used for drag and drop
var modelos = [];
var plane;
var selection;
var offset = new THREE.Vector3();
var raycaster = new THREE.Raycaster();

//#region Init
function init() {

    //Posição da camera
    camera.position.z = 1000;

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
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    //carregar menu 
    menu = document.getElementById("menu");

    //carregar canvas no body
    var canvas = render.domElement;
    document.body.appendChild(canvas);

    //estatistica do fps
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);


    //Carrega modelo inicial e cria menu
    loadMolecule('models/molecules/glucose.pdb', -15,0,0);
    loadMolecule('models/molecules/cu.pdb',15,0,0);
    createMenu();

    document.addEventListener('mousedown', onDocumentMouseDown, false);

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    document.addEventListener('mouseup', onDocumentMouseUp, false);

    //chamada da função desenhar
    desenhar();
}

//#endregion

//#region Menu
function generateButtonCallback(url) {
    return function () {
        loadMolecule(url, 0,0,0);
    };
    
}

function createMenu() {
    for (var m in MOLECULES) {
        var button = document.createElement('button');
        button.innerHTML = m;
        menu.appendChild(button);
        var url = 'models/molecules/' + MOLECULES[m];
        button.addEventListener('click', generateButtonCallback(url), false);
    }
}
//#endregion

//#region Carregar moleculas
function loadMolecule(url,x,y,z) {
    var modelo = new THREE.Group();

    while (modelo.children.length > 0) {
        var object = modelo.children[0];
        object.parent.remove(object);
    }

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
            position.x = positions.getX(i) + x;
            position.y = positions.getY(i) + y;
            position.z = positions.getZ(i) + z;
            color.r = colors.getX(i);
            color.g = colors.getY(i);
            color.b = colors.getZ(i);
            var material = new THREE.MeshPhongMaterial({ color: color });
            var object = new THREE.Mesh(sphereGeometry, material);
            object.position.copy(position);
            object.position.multiplyScalar(75);
            object.scale.multiplyScalar(25);
            modelo.add(object);
            var atom = json.atoms[i];
            var text = document.createElement('div');
            text.className = 'label';
            text.style.color = 'rgb(' + atom[3][0] + ',' + atom[3][1] + ',' + atom[3][2] + ')';
            text.textContent = atom[4];
            var label = new THREE.CSS2DObject(text);
            label.position.copy(object.position);
            modelo.add(label);
        }
        positions = geometryBonds.getAttribute('position');
        var start = new THREE.Vector3();
        var end = new THREE.Vector3();
        for (var i = 0; i < positions.count; i += 2) {
            start.x = positions.getX(i) + x;
            start.y = positions.getY(i) + y;
            start.z = positions.getZ(i) + z;
            end.x = positions.getX(i + 1) + x;
            end.y = positions.getY(i + 1) + y;
            end.z = positions.getZ(i + 1) + z;
            start.multiplyScalar(75);
            end.multiplyScalar(75);
            var object = new THREE.Mesh(boxGeometry, new THREE.MeshPhongMaterial(0xffffff));
            object.position.copy(start);
            object.position.lerp(end, 0.5);
            object.scale.set(5, 5, start.distanceTo(end));
            object.lookAt(end);
            modelo.add(object);
        }
        cena.add(modelo);
        modelos.push(modelo);
        console.log(modelos)
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

var light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(1, 1, 1);
cena.add(light);
var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(- 1, - 1, 1);
cena.add(light);

//carregar sombras nos objetos
//#endregion 

//#region mover objeto com mouse

// Plane, that helps to determinate an intersection position
plane = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000, 18, 18), new THREE.MeshBasicMaterial({
    opacity: 0,
    transparent: true
}));
cena.add(plane);

function onDocumentMouseDown(event) {
    // Get mouse position
    var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    // Get 3D vector from 3D mouse position using 'unproject' function
    var vector = new THREE.Vector3(mouseX, mouseY, 1);
    vector.unproject(camera);
    // Set the raycaster position
    raycaster.set(camera.position, vector.sub(camera.position).normalize());
    // Find all intersected objects
    var intersects = raycaster.intersectObjects(modelos, true, modelos[0]);
    console.log(intersects);
    if (intersects.length > 0) {
        // Disable the controls
        controls.enabled = false;
        // Set the selection - first intersected object
        selection = intersects[0].object;
        // Calculate the offset
        var intersects = raycaster.intersectObject(plane, true);
        offset.copy(intersects[0].point).sub(plane.position);
    }
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    // Get mouse position
    var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    // Get 3D vector from 3D mouse position using 'unproject' function
    var vector = new THREE.Vector3(mouseX, mouseY, 1);
    vector.unproject(camera);
    // Set the raycaster position
    raycaster.set(camera.position, vector.sub(camera.position).normalize());
    if (selection) {
        // Check the position where the plane is intersected
        var intersects = raycaster.intersectObject(plane, true);
        // Reposition the object based on the intersection point with the plane
        selection.position.copy(intersects[0].point.sub(offset));
    } else {
        // Update position of the plane if need
        var intersects = raycaster.intersectObjects(modelos, true);
        if (intersects.length > 0) {
            plane.position.copy(intersects[0].object.position);
            plane.lookAt(camera.position);
        }
    }
}

function onDocumentMouseUp(event) {
    // Enable the controls
    controls.enabled = true;
    selection = null;
}
//#endregion

 //#region mover objeto com Teclas
 function processaTeclas() {
    var vel = 15;
    if (teclas[37]) { //seta esquerda
        modelos[2].position.x -= vel;
    }
    if (teclas[39]) { //seta direita
        modelos[2].position.x += vel;
    }
    if (teclas[38]) { //seta cima
        modelos[2].position.y += vel;
    }
    if (teclas[40]) { //seta baixo
        modelos[2].position.y -= vel;
    }
}
document.onkeyup = function (evt) {
    teclas[evt.keyCode] = false;
}

document.onkeydown = function (evt) {
    teclas[evt.keyCode] = true;
}
//#endregion


function desenhar() {
    stats.begin();
    processaTeclas();
    render.render(cena, camera);
    labelRenderer.render(cena, camera);
    //camera.lookAt(modelos[0].position);
    //camera.position.x = modelos[2].position.x;
    controls.update();
    stats.end();
    requestAnimationFrame(desenhar);
}

window.onload = init();