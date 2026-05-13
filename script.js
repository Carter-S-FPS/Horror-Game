import * as THREE from 'three';

// Global Variables
let scene, camera, renderer, flashlight, surgeon;
let moveForward = 0, moveRight = 0;
let isWalking = false;

// Audio Elements
const bgMusic = document.getElementById('bg-music');
const footstepAudio = document.getElementById('footstep-audio');
footstepAudio.volume = 0.4;

// Joystick Elements
const stick = document.getElementById('joystick-stick');
const base = document.getElementById('joystick-base');

document.getElementById('play-btn').addEventListener('click', () => {
    document.getElementById('ui').style.display = 'none';
    bgMusic.play();
    init();
});

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.15);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 2. Lighting (Flashlight)
    flashlight = new THREE.SpotLight(0xffffff, 40);
    flashlight.angle = Math.PI / 6;
    flashlight.penumbra = 0.6;
    camera.add(flashlight);
    flashlight.position.set(0, 0, 1);
    flashlight.target = camera;
    scene.add(camera);

    // 3. Create Objects
    createAsylumHallway();
    createSurgeon();
    setupMobileControls();
    animate();
}

function createSurgeon() {
    surgeon = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    const size = 0.35; // Your 35x35x35 block size

    const bodyParts = [
        { name: 'head',  geo: [size, size, size], pos: [0, 0.8, 0] },
        { name: 'torso', geo: [size, size * 1.5, size], pos: [0, 0.4, 0] },
        { name: 'lLeg',  geo: [size/2, size, size/2], pos: [-0.1, 0, 0] },
        { name: 'rLeg',  geo: [size/2, size, size/2], pos: [0.1, 0, 0] },
        { name: 'lArm',  geo: [size/2, size, size/2], pos: [-0.25, 0.5, 0] },
        { name: 'rArm',  geo: [size/2, size, size/2], pos: [0.25, 0.5, 0] }
    ];

    bodyParts.forEach(p => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...p.geo), mat);
        mesh.position.set(...p.pos);
        surgeon.add(mesh);
    });

    surgeon.position.set(0, 0, -8);
    scene.add(surgeon);
}

function createAsylumHallway() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x1a1d1a });
    for (let i = 0; i < 20; i++) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 10), new THREE.MeshLambertMaterial({color: 0x050505}));
        floor.rotation.x = -Math.PI / 2;
        floor.position.z = -i * 10;
        scene.add(floor);

        const lWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 10), wallMat);
        lWall.position.set(-2.5, 2.5, -i * 10);
        scene.add(lWall);

        const rWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 10), wallMat);
        rWall.position.set(2.5, 2.5, -i * 10);
        scene.add(rWall);
    }
}

// 4. Mobile Joystick Logic
function setupMobileControls() {
    let dragging = false;

    const handleMove = (e) => {
        if (!dragging) return;
        const touch = e.touches[0];
        const rect = base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        const distance = Math.min(Math.sqrt(dx*dx + dy*dy), 50);
        const angle = Math.atan2(dy, dx);

        stick.style.transform = `translate(${Math.cos(angle)*distance}px, ${Math.sin(angle)*distance}px)`;

        // Set movement speed based on joystick distance
        moveForward = -Math.sin(angle) * (distance / 50) * 0.1;
        moveRight = Math.cos(angle) * (distance / 50) * 0.1;
        isWalking = distance > 5; 
    };

    base.addEventListener('touchstart', () => dragging = true);
    window.addEventListener('touchend', () => {
        dragging = false;
        stick.style.transform = `translate(0,0)`;
        moveForward = 0;
        moveRight = 0;
        isWalking = false;
    });
    window.addEventListener('touchmove', handleMove);
}

function animate() {
    requestAnimationFrame(animate);

    // Movement & Footsteps
    if (isWalking) {
        camera.position.z += moveForward;
        camera.position.x += moveRight;
        
        // Head bobbing
        camera.position.y = 1.6 + Math.sin(Date.now() * 0.008) * 0.05;

        if (footstepAudio.paused) footstepAudio.play();
    } else {
        footstepAudio.pause();
    }

    // Surgeon Animation
    const t = Date.now() * 0.005;
    surgeon.children[2].rotation.x = Math.sin(t) * 0.5; // Left Leg
    surgeon.children[3].rotation.x = -Math.sin(t) * 0.5; // Right Leg
    surgeon.children[4].rotation.x = -Math.sin(t) * 0.5; // Left Arm
    surgeon.children[5].rotation.x = Math.sin(t) * 0.5; // Right Arm

    renderer.render(scene, camera);
}
