import * as THREE from 'three';

let scene, camera, renderer, flashlight, surgeon;
let moveForward = 0, moveRight = 0, isWalking = false;

const bgMusic = document.getElementById('bg-music');
const footstepAudio = document.getElementById('footstep-audio');
const playBtn = document.getElementById('play-btn');

// Start the game on click
playBtn.addEventListener('click', () => {
    console.log("Game Starting...");
    document.getElementById('ui').style.display = 'none';
    document.getElementById('mobile-controls').style.display = 'block';
    
    // Unlock Audio
    bgMusic.play().catch(e => console.error("Audio error:", e));
    footstepAudio.play().then(() => footstepAudio.pause()); // Prime the audio

    init();
});

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.15);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Flashlight
    flashlight = new THREE.SpotLight(0xffffff, 50);
    flashlight.angle = Math.PI / 6;
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
    const size = 0.35; // 35x35x35 logic
    const mat = new THREE.MeshLambertMaterial({ color: 0x445544 });

    // Separate Meshes
    const head = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshLambertMaterial({color: 0x222222}));
    const torso = new THREE.Mesh(new THREE.BoxGeometry(size, size * 1.5, size), mat);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat);
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(size/2, size, size/2), mat);

    head.position.y = 0.8;
    torso.position.y = 0.4;
    lArm.position.set(-0.25, 0.5, 0);
    rArm.position.set(0.25, 0.5, 0);
    lLeg.position.set(-0.1, 0, 0);
    rLeg.position.set(0.1, 0, 0);

    surgeon.add(head, torso, lArm, rArm, lLeg, rLeg);
    surgeon.position.set(0, 0, -10);
    scene.add(surgeon);
}

function createAsylum() {
    const wallGeo = new THREE.BoxGeometry(0.1, 5, 10);
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x1a1d1a });
    
    for (let i = 0; i < 20; i++) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 10), new THREE.MeshLambertMaterial({color: 0x050505}));
        floor.rotation.x = -Math.PI / 2;
        floor.position.z = -i * 10;
        scene.add(floor);

        const lWall = new THREE.Mesh(wallGeo, wallMat);
        lWall.position.set(-2.5, 2.5, -i * 10);
        scene.add(lWall);

        const rWall = new THREE.Mesh(wallGeo, wallMat);
        rWall.position.set(2.5, 2.5, -i * 10);
        scene.add(rWall);
    }
}

function setupJoystick() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    let dragging = false;

    const move = (e) => {
        if (!dragging) return;
        const touch = e.touches ? e.touches[0] : e;
        const rect = base.getBoundingClientRect();
        const center = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
        
        let dx = touch.clientX - center.x;
        let dy = touch.clientY - center.y;
        const dist = Math.min(Math.sqrt(dx*dx + dy*dy), 40);
        const angle = Math.atan2(dy, dx);

        stick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
        
        moveForward = -Math.sin(angle) * (dist/40) * 0.12;
        moveRight = Math.cos(angle) * (dist/40) * 0.12;
        isWalking = dist > 5;
    };

    base.addEventListener('touchstart', () => dragging = true);
    window.addEventListener('touchend', () => {
        dragging = false;
        stick.style.transform = `translate(0,0)`;
        isWalking = false;
        moveForward = 0; moveRight = 0;
    });
    window.addEventListener('touchmove', move);
}

function animate() {
    requestAnimationFrame(animate);

    if (isWalking) {
        camera.position.z += moveForward;
        camera.position.x += moveRight;
        camera.position.y = 1.6 + Math.sin(Date.now() * 0.008) * 0.04;
        if (footstepAudio.paused) footstepAudio.play();
    } else {
        footstepAudio.pause();
    }

    // Surgeon Stalking
    const t = Date.now() * 0.005;
    surgeon.position.z += 0.005; 
    surgeon.children[4].rotation.x = Math.sin(t) * 0.6; // Leg L
    surgeon.children[5].rotation.x = -Math.sin(t) * 0.6; // Leg R

    renderer.render(scene, camera);
}
