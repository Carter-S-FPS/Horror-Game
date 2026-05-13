import * as THREE from 'three';

let scene, camera, renderer, flashlight, surgeon;
const music = document.getElementById('bg-music');

document.getElementById('play-btn').addEventListener('click', () => {
    document.getElementById('ui').style.display = 'none';
    music.play();
    init();
});

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.15); // Fog makes it "Endless"

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Low-poly feel
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Flashlight (The SpotLight)
    flashlight = new THREE.SpotLight(0xffffff, 50);
    flashlight.angle = Math.PI / 6;
    flashlight.penumbra = 0.5;
    camera.add(flashlight);
    flashlight.position.set(0, 0, 1);
    flashlight.target = camera;
    scene.add(camera);

    createAsylumHallway();
    createSurgeon();
    animate();
}

// 3. The Low-Poly Surgeon (35x35x35 blocks)
function createSurgeon() {
    surgeon = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x445544 }); // Blood-stained green
    
    // Each part is a 0.35 unit cube (mapping to your 35x35x35 request)
    const size = 0.35;
    const parts = {
        head:  new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshLambertMaterial({color: 0x222222})),
        torso: new THREE.Mesh(new THREE.BoxGeometry(size, size * 1.5, size), mat),
        lLeg:  new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat),
        rLeg:  new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat),
        lArm:  new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat),
        rArm:  new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat)
    };

    // Position Parts
    parts.head.position.y = 0.8;
    parts.torso.position.y = 0.4;
    parts.lLeg.position.set(-0.1, 0, 0);
    parts.rLeg.position.set(0.1, 0, 0);
    parts.lArm.position.set(-0.25, 0.5, 0);
    parts.rArm.position.set(0.25, 0.5, 0);

    surgeon.add(parts.head, parts.torso, parts.lLeg, parts.rLeg, parts.lArm, parts.rArm);
    surgeon.position.set(0, 0, -5);
    scene.add(surgeon);
}

// 4. The Endless Hallway Logic
function createAsylumHallway() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x050505 });

    for (let i = 0; i < 10; i++) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 10), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.z = -i * 10;
        scene.add(floor);

        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 10), wallMat);
        leftWall.position.set(-2, 2, -i * 10);
        scene.add(leftWall);

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 10), wallMat);
        rightWall.position.set(2, 2, -i * 10);
        scene.add(rightWall);
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Surgeon Movement (Walking forward)
    const time = Date.now() * 0.005;
    surgeon.position.z += 0.01; 
    
    // Simple "Limb" swing animation
    surgeon.children[2].rotation.x = Math.sin(time) * 0.5; // Left Leg
    surgeon.children[3].rotation.x = -Math.sin(time) * 0.5; // Right Leg
    surgeon.children[4].rotation.x = -Math.sin(time) * 0.5; // Left Arm
    surgeon.children[5].rotation.x = Math.sin(time) * 0.5; // Right Arm

    // Camera movement (Simulate walking)
    camera.position.z -= 0.02;
    camera.position.y = 1.6 + Math.sin(time) * 0.02; // Head bob

    renderer.render(scene, camera);
}
