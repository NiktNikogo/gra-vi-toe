
document.getElementById('MainText').textContent += window.location;
let myTurn = -1;
let turn = 0;
let overallTrun = 0;
let playing = false;

const [w, h] = [500, 500];
const [oX, oY, oZ] = [0, 0, 0];
const r = 10;
const shapeConf = [
    { color: 0xff3333, opacity: 1, transparent: true, edges: true, name: 'Cube' },
    { color: 0x33ff33, opacity: 1, transparent: true, edges: false, name: 'Ball' },
    { color: 0x3333ff, opacity: 1, transparent: true, edges: true, name: 'Pyramid' },
    { color: 0x565656, opacity: 1.0, transparent: false, edges: false }];
const geometries = [
    new THREE.BoxGeometry(r - 2, r - 2, r - 2),
    new THREE.SphereGeometry(r/2),
    new THREE.ConeGeometry(r/2, r, 4)
]
let ico = null;
let lastName = '';
let counter = 0;
function addLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x333333);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);
}
function init() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#mainCanvas'),
        preserveDrawingBuffer: true,
        alpha: true
    })
    renderer.setClearColor(0xff00ff, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);

    const pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(12, 14, 10);
    pointLight.name = 'pointLight';
    camera.position.z = 25;
    camera.position.y += 40;
    camera.add(pointLight);
    camera.name = 'camera';
    scene.add(camera);

    renderer.render(scene, camera);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePen = false;
    controls.enableZoom = false;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: ''
    }
    const raycaster = new THREE.Raycaster();

    return { scene: scene, camera: camera, renderer: renderer, controls: controls, raycaster: raycaster };
}
function addGameGrid(scene, r) {
    const geometry = new THREE.CylinderGeometry(r / 16, r / 16, r * 2, 32);
    const material = new THREE.MeshStandardMaterial({
        color: shapeConf[3].color, transparent: shapeConf[3].transparent,
        opacity: shapeConf[3].opacity
    });
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 4; i++) {
            const cylinder = new THREE.Mesh(geometry, material);
            const x = (i & 1) * r - r / 2;
            const z = ((i >> 1) & 1) * r - r / 2
            const xRot = (j & 1) * Math.PI / 2;
            const zRot = ((j >> 1) & 1) * Math.PI / 2;
            cylinder.position.set(x + oX, 0 + oY, z + oZ);
            cylinder.rotation.set(xRot, 0, zRot);
            cylinder.name = `cylinder${j}${i}`;
            scene.add(cylinder);
            const cylinderHigher = cylinder.clone();
            cylinderHigher.position.set(x + oX, r + oY, z + oZ);
            scene.add(cylinderHigher);
        }
    }

    let pos = [
        13 % 3, (Math.floor(13/3)) % 3, (Math.floor(13 / 9)) % 3
    ]
    pos = posToCoords(pos);
    const icoGemotery = new THREE.IcosahedronGeometry(r - 5);
    const icoMaterial = new THREE.MeshStandardMaterial({color: 0x00FFFF});
    mesh = new THREE.Mesh(icoGemotery, icoMaterial);
    mesh.position.set(pos[0] + oX, pos[1] + oY, pos[2] + oZ);
    mesh.name = `cell${13}`;
    scene.add(mesh);
    ico = scene.getObjectByName(`cell${13}`);
}
function posToCoords(boardPos) {
    return [
        (boardPos[0] - 1) * r,
        (boardPos[1] - 1) * r + r / 2,
        (boardPos[2] - 1) * r
    ]
} 
function numToPos(n) {
    return [
        n % 3, (Math.floor(n / 3)) % 3, (Math.floor(n / 9)) % 3
    ];
}
function posToNum(pos) {
    return pos[0] + pos[1] * 3 + pos[2] * 9;
}
function addEdges(pos, rot, geometry) {
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges,
        new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    line.position.set(pos[0], pos[1], pos[2]);
    line.rotation.set(0, rot[1], rot[2]);
    return line;
}
function addShape(scene, shape, pos, r, config, name) {
    let geometry;
    switch (shape) {
        case 0:
            geometry = new THREE.BoxGeometry(2 * r, 2 * r, 2 * r);
            break;
        case 1:
            geometry = new THREE.SphereGeometry(r, 64, 64);
            break;
        case 2:
            geometry = new THREE.ConeGeometry(r, r * 2, 4);
            break;
    }
    const { color, opacity, transparent, edges } = config;
    const material = new THREE.MeshStandardMaterial({ color: color, opacity: opacity, transparent: transparent });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(pos[0] + oX, pos[1] + oY, pos[2] + oZ);
    if (shape == 2) {
        mesh.position.y -= r / 4;
        mesh.rotateY(Math.PI / 4);
    }
    scene.add(mesh);
    if (edges) {
        const { _x, _y, _z } = mesh.rotation;
        const meshEdges = addEdges(Array.from(mesh.position),
            [_x, _y, _z], geometry);
        meshEdges.name = name + 'edges';
        scene.add(meshEdges);
    }
}
function addToBoard(scene, shape, pos) {
    const name = `pawn${posToNum(pos)}`;
    pos = posToCoords(pos);
    addShape(scene, shape, pos, r / 2 - 2, shapeConf[shape], name);
    printState();
}
function clearBoard() {
    let children = scene.children;
    let toRemove = [];
    for (let i = 0; i < children.length; i++) {
        for (let j = 0; j < 3; j++) {
            if (children[i].name.includes(shapeConf[j].name)) {
                toRemove.push(children[i]);
            }
        }
    }
    toRemove.forEach((obj) => {
        scene.remove(obj);
    })
}
function populateBoard() {
    for(let i = 0; i < 27; i++) {
        if(i == 13) {
            continue
        }
        let pos = [i % 3, (Math.floor(i/3)) % 3, (Math.floor(i / 9)) % 3]
        pos = posToCoords(pos);
        const material = new THREE.MeshStandardMaterial(
            {color: 0xFF00FF, opacity: 0.5, transparent: true});    
        const mesh = new THREE.Mesh(geometries[myTurn], material);
    
        mesh.position.set(pos[0] + oX, pos[1] + oY, pos[2] + oZ);
        mesh.name = `cell${i}`;
        scene.add(mesh);
    }
    ico = scene.getObjectByName(`cell${13}`);
}
function onLeftClick() {
    if(lastName != '') {
        let which = lastName.substr(4);
        let pos = numToPos(which);
        const maximalY = pos[1];
        for(let i = 0; i <= maximalY; i++) {
            pos = [pos[0], i, pos[2]];
            which = posToNum(pos);
            if(which == 13) {
                continue;
            }
            if(scene.getObjectByName(`pawn${which}`) == null && myTurn == turn && playing) {
                scene.remove(scene.getObjectByName(`cell${which}`));
                lastName = '';
                addToBoard(scene, myTurn, pos);
                counter++;
                counter %= 3;
                let data = {
                    turn: turn,
                    symbol: 0,
                    move: pos
                }
                socket.emit('move', {'data': data});
                break;
            }
        }
    } 
}
function onMouseMove(event) {
    const x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    const y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    
    raycaster.setFromCamera({x: x, y: y}, camera);
    const intersects = raycaster.intersectObjects( scene.children, false );
    for (let i = 0; i < intersects.length; i++) {
        const name = intersects[i].object.name;
        const material = intersects[i].object.material;
        if((name.includes('cylinder') || name == 'cell13') && lastName != '') {
            let last = scene.getObjectByName(lastName);
            last.material.color.set(0xff00ff);
            lastName = '';
            return;
        }
        if(name.includes('cell') && !name.includes('13')) {
            if(lastName == '') {
                lastName = name; 
                material.color.set(0xff0000);
            }
            if(lastName != name) {
                let last = scene.getObjectByName(lastName);
                last.material.color.set(0xff00ff);
                material.color.set(0xff0000);
                lastName = name;
            } 
            return;
        }
    }
    if(intersects.length < 1 && lastName != '') {
        let last = scene.getObjectByName(lastName);
        last.material.color.set(0xff00ff);
        lastName = '';
    }
} 
function printState() {
    let state = '';
    for(let i = 0; i < 27; i++) {
        if(scene.getObjectByName(`pawn${i}`) != null) {
            state += '1';
        } else {
            state += '0';
        }
    }
    console.log(state);
}
const { camera, scene, renderer, controls, raycaster } = init();
addLighting(scene);
addGameGrid(scene, r);

function animate() {
    requestAnimationFrame(animate);
   
    controls.update();
    ico.rotation.x += 0.005;
    ico.rotation.z -= 0.01;
    renderer.render(scene, camera);
}

const delta = 3;
let startX;
let startY;
window.addEventListener('mousedown', function (event) {
  startX = event.pageX;
  startY = event.pageY;
});

window.addEventListener('mouseup', function (event) {
  const diffX = Math.abs(event.pageX - startX);
  const diffY = Math.abs(event.pageY - startY);

  if (diffX < delta && diffY < delta) {
    onLeftClick();
  }
});

window.addEventListener( 'mousemove', onMouseMove );

animate();

let socket = io();
let count = 0;
let playerCount = document.getElementById('playerCount');
playerCount.style.marginLeft = `${w + 10}px`;
let turnCounter = document.getElementById('turnCounter');
turnCounter.style.marginLeft = `${w + 10}px`;
let mainText = document.getElementById('MainText');
mainText.style.marginLeft = `${w + 10}px`;
let pastTurnsList = document.getElementById('pastTurnsList');
pastTurnsList.style.marginLeft = `${w + 10}px`;

socket.on('new user', (data)=>{
    count = data.count;
    playerCount.textContent = `PlayerCount: ${data.count}`;
});
socket.on('user left', (data)=>{
    if(playing) {
        window.location = 'http://localhost:3000';
    }
    count = data.count;
    playerCount.textContent = `PlayerCount: ${data.count}`;
});
socket.on('move', (data)=> {
    const shape = turn;
    turn = (data.turn + 1) % 3;
    overallTrun += 1;
    const which = posToNum(data.move);
    scene.remove(scene.getObjectByName(`cell${which}`))
    addToBoard(scene, shape, data.move);
    turnCounter.textContent = `currentTurn: ${turn}`;
    pastTurnsList.innerHTML = `<img src=${data.image} id='Image${overallTrun}' width = "400" height = "400"/>` + 
        pastTurnsList.innerHTML;
});
socket.on('room filled', (data)=> {
    window.location = data.newUrl;
});
socket.on('game starting', (data)=>{
    playing = true;
    for (let i = 0; i < data.players.length; i++) {
        if(data.players[i] == socket.id) {
            myTurn = i;
            document.getElementById('MainText').textContent = `Player: ${myTurn}`;
            break;
        }
    }
    populateBoard();
    turnCounter.textContent = "currentTurn: 0";
});
socket.on('room closed', ()=>{
    window.location = 'http://localhost:3000';
});
socket.on('game ended', (data) =>{
    const status = data.status;
    if(status == 4) {
        alert('Remis');
    } else if(status != 0){
        alert(`Wygrał gracz ${status}`);
    }
    if(status != 0) {
        playing = false;
    }
});

