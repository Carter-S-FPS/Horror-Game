import * as THREE from 'three';

const progressBar = document.getElementById('progress-bar');
const loadingText = document.getElementById('loading-text');
const loadingScreen = document.getElementById('loading-screen');
const controls = document.getElementById('mobile-controls');
const bgMusic = document.getElementById('bg-music');
const footstepAudio = document.getElementById('footstep-audio');

let scene, camera, renderer, surgeon;
let moveForward = 0, moveRight = 0, isWalking = false;
let isLoaded = false;

// --- SMOOTH LOADING LOGIC ---
let currentProgress = 0;
function fakeLoad() {
    // Increment by very small amounts for smoothness
    let increment = Math.random() * 0.5; 
    currentProgress += increment;

    if (currentProgress >= 100) {
        currentProgress = 100;
        progressBar.style.width = '100%';
        loadingText.innerText = "READY. TAP SCREEN.";
        loadingText.style.color = "#ff0000";
        isLoaded = true;
        initGame(); // Build 3D in background
    } else {
        progressBar.style.width = currentProgress + '%';
        loadingText.innerText = "LOADING ASSETS... " + Math.floor(currentProgress) + "%";
        requestAnimationFrame(fakeLoad);
    }
}
// Start the smooth crawl
fakeLoad();

// Start game on first touch after 100%
const startPlay = () => {
    if (!isLoaded) return;
    
    loadingScreen.style.display = 'none';
    controls.style.display = 'block';

    bgMusic.play();
    // Prime footsteps
    footstepAudio.play().then(() => footstepAudio.pause());
    
    window.removeEventListener('touchstart', startPlay);
};
window.addEventListener('touchstart', startPlay);

function initGame() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.15);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.SpotLight(0xffffff, 60);
    camera.add(light);
    light.position.set(0,0,1);
    light.target = camera;
    scene.add(camera);

    createMap();
    createSurgeon();
    setupJoystick();
    animate();
}

function createSurgeon() {
    surgeon = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x3d443d });
    const s = 0.35; // 35x35x35 blocks

    const head = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshLambertMaterial({color: 0x000}));
    const torso = new THREE.Mesh(new THREE.BoxGeometry(s, s*1.5, s), mat);
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(s/2, s, s/2), mat);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(s/2, s, s/2), mat);

    head.position.y = 0.8; torso.position.y = 0.4;
    lLeg.position.set(-0.1, 0, 0); rLeg.position.set(0.1, 0, 0);

    surgeon.add(head, torso, lLeg, rLeg);
    surgeon.position.set(0, 0, -12);
    scene.add(surgeon);
}

function createMap() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    for (let i = 0; i < 40; i++) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 10), new THREE.MeshLambertMaterial({color: 0x040404}));
        floor.rotation.x = -Math.PI / 2; floor.position.z = -i * 10; scene.add(floor);
        const lW = new THREE.Mesh(new THREE.BoxGeometry(0.1, 6, 10), wallMat);
        lW.position.set(-3, 3, -i * 10); scene.add(lW);
        const rW = new THREE.Mesh(new THREE.BoxGeometry(0.1, 6, 10), wallMat);
        rW.position.set(3, 3, -i * 10); scene.add(rW);
    }
}

function setupJoystick() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    let active = false;

    const move = (e) => {
        if (!active) return;
        const t = e.touches[0];
        const r = base.getBoundingClientRect();
        const dx = t.clientX - (r.left + r.width/2);
        const dy = t.clientY - (r.top + r.height/2);
        const d = Math.min(Math.sqrt(dx*dx + dy*dy), 40);
        const a = Math.atan2(dy, dx);
        stick.style.transform = `translate(${Math.cos(a)*d}px, ${Math.sin(a)*d}px)`;
        moveForward = -Math.sin(a) * (d/40) * 0.15;
        moveRight = Math.cos(a) * (d/40) * 0.15;
        isWalking = d > 5;
    };

    base.addEventListener('touchstart', (e) => { active = true; move(e); });
    window.addEventListener('touchend', () => {
        active = false; stick.style.transform = `translate(0,0)`;
        isWalking = false; moveForward = 0; moveRight = 0;
    });
    window.addEventListener('touchmove', move, { passive: false });
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
    const t = Date.now() * 0.005;
    surgeon.position.z += 0.006;
    surgeon.children[2].rotation.x = Math.sin(t) * 0.5;
    surgeon.children[3].rotation.x = -Math.sin(t) * 0.5;
    renderer.render(scene, camera);
}
