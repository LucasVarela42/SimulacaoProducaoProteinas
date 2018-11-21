"use strict";

var cena = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set( 5, 2, 3 );
var render = new THREE.WebGLRenderer({ antialias: true });

render.setSize(window.innerWidth, window.innerHeight);

var canvas = render.domElement;
document.body.appendChild(canvas);

//#region Linha 
//Vamos desenhar a linha. Quer dizer, o circulo
var materialLinha = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
var geometriaLinha = new THREE.Geometry();

/* //CURVA SPLINE
var curva = new THREE.SplineCurve(
    [
        new THREE.Vector3(-1, 0, 0), //a
        new THREE.Vector3(-0.8, 0.2, 0), //b
        new THREE.Vector3(-0.8, 0.5, 0), //c
        new THREE.Vector3(-0.8, 0.9, 0), //d
        new THREE.Vector3(-0.4, 1, 0), //e
        new THREE.Vector3(0, 0.8, 0), //f
        new THREE.Vector3(0.6, 0.9, 0), //g
        new THREE.Vector3(1.2, 0.8, 0), //h
        new THREE.Vector3(1.1, 0.6, 0), //i
        new THREE.Vector3(0.6, 0.6, 0), //j
        new THREE.Vector3(0.2, 0.4, 0), //k
        new THREE.Vector3(0.4, 0.2, 0), //l
        new THREE.Vector3(0.8, 0.3, 0), //m
        new THREE.Vector3(1.2, 0.2, 0), //n
        new THREE.Vector3(1.4, -0.2, 0), //o
        new THREE.Vector3(1, -0.6, 0), //p
        new THREE.Vector3(0.4, -0.7, 0), //q
        new THREE.Vector3(-0.3, -0.8, 0), //r
        new THREE.Vector3(-0.9, -0.6, 0), //s
        new THREE.Vector3(-1.7, -0.9, 0), //t
        new THREE.Vector3(-2.1, -0.5, 0), //u
        new THREE.Vector3(-2.3, 0, 0), //v
        new THREE.Vector3(-1.9, 0.2, 0), //x
        new THREE.Vector3(-1.7, -0.1, 0), //w
        new THREE.Vector3(-1.5, -0.2, 0), //y
        new THREE.Vector3(-1.3, -0.2, 0), //z
        new THREE.Vector3(-1, 0, 0) //a
    ]
);
*/ //CURVA TESTE 2
var curva = new THREE.CatmullRomCurve3(
    [
        new THREE.Vector3(-1.5, 1.5, 0), 
        new THREE.Vector3(1.5, 1.5, 0), 
        new THREE.Vector3(1.5, -1.5, 0), 
        new THREE.Vector3(-1.5, -1.5, 0), 
        new THREE.Vector3(-1.5, 1.5, 0) 
    ]
);

var caminho = new THREE.Path(curva.getPoints(260));
var geometriaLinha = caminho.createPointsGeometry(260);
var linha = new THREE.Line(geometriaLinha, materialLinha);
cena.add(linha);
//#endregion

//#region Carro

function gerarCarro(width = 1, height = 1, depth = 1) {
    var geo = new THREE.BoxGeometry(width, height, depth);
    return geo;
}

var forma = new THREE.Mesh(gerarCarro(0.1, 0.2, 0.1), new THREE.MeshPhongMaterial({color: 0x00ff00}));
forma.position.set(0,0,0);
cena.add(forma);

//forma.material.wireframe = true;
//forma.material.side = THREE.DoubleSide;

//#endregion

//#region Movimentação do carro
var count = 0;
function movimentacao() {
    if(count > linha.geometry.vertices.length-1) {  count = 0; }
   
    var vertice = linha.geometry.vertices[count];
    forma.position.set(vertice.x, vertice.y, vertice.z);
    forma.geometry.verticesNeedUpdate = true;

    count++;
}
//#endregion

//#region Animação do carro
var up = new THREE.Vector3( 0, 1, 0 );
var axis = new THREE.Vector3();
var carPosition, radians, axis, tangent;
var t = 0;
var acelaracao = 0.002;
var frear = 0.001;

function animacaoCarro() {
    carPosition = curva.getPoint(t);
    forma.position.set(carPosition.x, carPosition.y, carPosition.z);
    tangent = curva.getTangent(t).normalize();
    axis.crossVectors(up, tangent).normalize();
    radians = Math.acos(up.dot(tangent));
    forma.quaternion.setFromAxisAngle(axis, radians);

    t = (t >= 1) ? 0 : t += acelaracao;
}
//#endregion

//#region Luz
var luzAmbiente = new THREE.AmbientLight(0xFFFFFF);
cena.add(luzAmbiente);

var luzPonto = new THREE.PointLight(0xFFFFFF);
luzPonto.position.set(0, 4, 4);
cena.add(luzPonto);
//#endregion 

//#region Camera
var teclas = [];

for (var i = 0; i < 256; i++) {
    teclas[i] = false;
}

var camera_pivot = new THREE.Object3D();
var Y_AXIS = new THREE.Vector3( 0, 1, 0 );
var X_AXIS = new THREE.Vector3( 1, 0, 0 );
var Z_AXIS = new THREE.Vector3( 0, 0, 1 );

cena.add( camera_pivot );
camera_pivot.add( camera );
camera_pivot.rotation.set(1.5,0,0)

camera.lookAt( camera_pivot.position );

function processaTeclas() {
	if (teclas[37]) { //seta esquerda
		camera_pivot.rotateOnAxis( Y_AXIS, 0.008 );
	}
	if (teclas[39]) { //seta direita
		camera_pivot.rotateOnAxis( Y_AXIS, -0.008 );
	}
	if (teclas[38]) { //seta cima
		camera_pivot.rotateOnAxis( X_AXIS, 0.008 );
	}
	if (teclas[40]) { //seta baixo
		camera_pivot.rotateOnAxis( X_AXIS, -0.008 );
	}
	if (teclas[65]) { //a
		camera_pivot.rotateOnAxis( Z_AXIS, 0.008 );
    }
    if (teclas[83]) { //s
		camera_pivot.rotateOnAxis( Z_AXIS, -0.008 );
    }
    if (teclas[90]) { //s
        if(Math.round(acelaracao) < 0.040)
            acelaracao += acelaracao + 0.001;
    }
    if (teclas[88]) { //s
        if(acelaracao > 0.001)
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

function desenhar() {
    movimentacao();	
    processaTeclas();
    animacaoCarro();
    render.render(cena, camera);
    requestAnimationFrame(desenhar);
}

requestAnimationFrame(desenhar);