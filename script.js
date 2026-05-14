import * as THREE from 'three';

let scene, camera, renderer, flashlight, surgeon;
let moveForward = 0, moveRight = 0, isWalking = false;

const bgMusic = document.getElementById('bg-music');
const footstepAudio = document.getElementById('footstep-audio');
const playBtn = document.getElementById('play-btn');

// Start logic: Uses 'touchstart' for instant mobile response
const startHandler = (e) => {
    if (e) e.preventDefault();
    document.getElementById('ui').style.display = 'none';
    document.getElementById('mobile-controls').style.display = 'block';

    bgMusic.play(); // Start horror ambience
    
    // Unlocks and primes footstep audio for mobile
    footstepAudio.play().then(() => {
        footstepAudio.pause();
        footstepAudio.currentTime = 0;
    });

    init();
};

playBtn.addEventListener('touchstart', startHandler, { passive: false });
playBtn.addEventListener('click', startHandler);

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.15);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.zIndex = "1";
    document.body.appendChild(renderer.domElement);

    flashlight = new THREE.SpotLight(0xffffff, 50);
    camera.add(flashlight);
    flashlight.position.set(0, 0, 1);
    flashlight.target = camera;
    scene.add(camera);

    createAsylum();
    createSurgeon();
    setupJoystick();
    animate();
}

function createSurgeon() {
    surgeon = new THREE.Group();
    const size = 0.35; // Standard block size
    const mat = new THREE.MeshLambertMaterial({ color: 0x3d443d });

    // Distinct meshes for body parts
    const head = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshLambertMaterial({color: 0x111}));
    const torso = new THREE.Mesh(new THREE.BoxGeometry(size, size * 1.6, size), mat);
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat);

    head.position.y = 0.8;
    torso.position.y = 0.4;
    lLeg.position.set(-0.1, 0, 0);
    rLeg.position.set(0.1, 0, 0);
    lArm.position.set(-0.25, 0.5, 0);
    rArm.position.set(0.25, 0.5, 0);

    surgeon.add(head, torso, lLeg, rLeg, lArm, rArm);
    surgeon.position.set(0, 0, -10);
    scene.add(surgeon);
}

function createAsylum() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x151515 });
    for (let i = 0; i < 30; i++) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 10), new THREE.MeshLambertMaterial({color: 0x050505}));
        floor.rotation.x = -Math.PI / 2;
        floor.position.z = -i * 10;
        scene.add(floor);

        const lWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 6, 10), wallMat);
        lWall.position.set(-3, 3, -i * 10);
        scene.add(lWall);

        const rWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 6, 10), wallMat);
        rWall.position.set(3, 3, -i * 10);
        scene.add(rWall);
    }
}

function setupJoystick() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    let dragging = false;

    const move = (e) => {
        if (!dragging) return;
        const touch = e.touches[0];
        const rect = base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        const dist = Math.min(Math.sqrt(dx*dx + dy*dy), 45);
        const angle = Math.atan2(dy, dx);

        stick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
        
        moveForward = -Math.sin(angle) * (dist/45) * 0.13;
        moveRight = Math.cos(angle) * (dist/45) * 0.13;
        isWalking = dist > 8;
    };

    base.addEventListener('touchstart', () => { dragging = true; });
    window.addEventListener('touchend', () => {
        dragging = false;
        stick.style.transform = `translate(0,0)`;
        isWalking = false;
        moveForward = 0; moveRight = 0;
    });
    window.addEventListener('touchmove', move, { passive: false });
}

function animate() {
    requestAnimationFrame(animate);

    if (isWalking) {
        camera.position.z += moveForward;
        camera.position.x += moveRight;
        camera.position.y = 1.6 + Math.sin(Date.now() * 0.01) * 0.04;
        if (footstepAudio.paused) footstepAudio.play(); //
    } else {
        footstepAudio.pause(); //
    }

    // Surgeon Stalking Animation
    const t = Date.now() * 0.005;
    surgeon.position.z += 0.006;
    surgeon.children[2].rotation.x = Math.sin(t) * 0.5; // Left Leg
    surgeon.children[3].rotation.x = -Math.sin(t) * 0.5; // Right Leg

    renderer.render(scene, camera);
}
