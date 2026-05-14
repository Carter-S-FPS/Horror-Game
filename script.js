import * as THREE from 'three';

let scene, camera, renderer, flashlight, surgeon;
let moveForward = 0, moveRight = 0, isWalking = false;

const bgMusic = document.getElementById('bg-music');
const footstepAudio = document.getElementById('footstep-audio');
const playBtn = document.getElementById('play-btn');

// Start Function - Handles the transition from UI to Game
const startApp = (e) => {
    if(e) e.preventDefault();
    console.log("Starting Asylum Engine...");

    document.getElementById('ui').style.display = 'none';
    document.getElementById('mobile-controls').style.display = 'block';

    // Play Ambience
    bgMusic.play().catch(err => console.log("Audio waiting for interaction"));
    
    // Unlock and pause footsteps so they're ready to play later
    footstepAudio.play().then(() => {
        footstepAudio.pause();
        footstepAudio.currentTime = 0;
    });

    init();
};

// Double-binding to ensure mobile and desktop both work
playBtn.addEventListener('touchstart', startApp, { passive: false });
playBtn.addEventListener('click', startApp);

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.15);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Lower the canvas Z-index so it doesn't block UI elements
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.zIndex = "1";
    document.body.appendChild(renderer.domElement);

    // Dynamic Flashlight
    flashlight = new THREE.SpotLight(0xffffff, 60);
    flashlight.angle = Math.PI / 7;
    camera.add(flashlight);
    flashlight.position.set(0, 0, 1);
    flashlight.target = camera;
    scene.add(camera);

    createWorld();
    createSurgeon();
    setupMobileInputs();
    animate();
}

function createSurgeon() {
    surgeon = new THREE.Group();
    const s = 0.35; // 35x35x35 blocks
    const mat = new THREE.MeshLambertMaterial({ color: 0x2e332e });

    // Individual Limb Meshes
    const head = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshLambertMaterial({color: 0x000}));
    const torso = new THREE.Mesh(new THREE.BoxGeometry(s, s*1.5, s), mat);
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(s/2, s, s/2), mat);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(s/2, s, s/2), mat);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(s/2, s, s/2), mat);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(s/2, s, s/2), mat);

    head.position.y = 0.8;
    torso.position.y = 0.4;
    lLeg.position.set(-0.1, 0, 0);
    rLeg.position.set(0.1, 0, 0);
    lArm.position.set(-0.25, 0.5, 0);
    rArm.position.set(0.25, 0.5, 0);

    surgeon.add(head, torso, lLeg, rLeg, lArm, rArm);
    surgeon.position.set(0, 0, -15);
    scene.add(surgeon);
}

function createWorld() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    for (let i = 0; i < 50; i++) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 10), new THREE.MeshLambertMaterial({color: 0x030303}));
        floor.rotation.x = -Math.PI / 2;
        floor.position.z = -i * 10;
        scene.add(floor);

        const lW = new THREE.Mesh(new THREE.BoxGeometry(0.1, 6, 10), wallMat);
        lW.position.set(-3, 3, -i * 10);
        scene.add(lW);

        const rW = new THREE.Mesh(new THREE.BoxGeometry(0.1, 6, 10), wallMat);
        rW.position.set(3, 3, -i * 10);
        scene.add(rW);
    }
}

function setupMobileInputs() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    let active = false;

    const onMove = (e) => {
        if (!active) return;
        const t = e.touches[0];
        const r = base.getBoundingClientRect();
        const cX = r.left + r.width / 2;
        const cY = r.top + r.height / 2;

        let dx = t.clientX - cX;
        let dy = t.clientY - cY;
        const d = Math.min(Math.sqrt(dx*dx + dy*dy), 45);
        const a = Math.atan2(dy, dx);

        stick.style.transform = `translate(${Math.cos(a)*d}px, ${Math.sin(a)*d}px)`;
        
        moveForward = -Math.sin(a) * (d/45) * 0.15;
        moveRight = Math.cos(a) * (d/45) * 0.15;
        isWalking = d > 10;
    };

    base.addEventListener('touchstart', () => active = true);
    window.addEventListener('touchend', () => {
        active = false;
        stick.style.transform = `translate(0,0)`;
        isWalking = false;
        moveForward = 0; moveRight = 0;
    });
    window.addEventListener('touchmove', onMove, { passive: false });
}

function animate() {
    requestAnimationFrame(animate);

    if (isWalking) {
        camera.position.z += moveForward;
        camera.position.x += moveRight;
        camera.position.y = 1.6 + Math.sin(Date.now() * 0.01) * 0.05;
        if (footstepAudio.paused) footstepAudio.play();
    } else {
        footstepAudio.pause();
    }

    // Stalker Animation
    const now = Date.now() * 0.005;
    surgeon.position.z += 0.01; // He slowly follows
    surgeon.children[2].rotation.x = Math.sin(now) * 0.6; // L-Leg
    surgeon.children[3].rotation.x = -Math.sin(now) * 0.6; // R-Leg

    renderer.render(scene, camera);
}
