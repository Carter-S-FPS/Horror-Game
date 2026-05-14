import * as THREE from 'three';

const progressBar = document.getElementById('progress-bar');
const loadingText = document.getElementById('loading-text');
const loadingScreen = document.getElementById('loading-screen');
const controls = document.getElementById('mobile-controls');
const bgMusic = document.getElementById('bg-music');
const footstepAudio = document.getElementById('footstep-audio');

let scene, camera, renderer, surgeon, flashlight;
let moveForward = 0, moveRight = 0, isWalking = false;
let segments = [];
let isLoaded = false;
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();

// --- FIXED LOADING LOGIC ---
let progress = 0;
function startLoadingBar() {
    // We use a small timeout to ensure the browser has breath to animate the bar
    let increment = Math.random() * 0.8; 
    progress += increment;

    if (progress >= 100) {
        progress = 100;
        progressBar.style.width = '100%';
        loadingText.innerText = "READY. TAP TO START.";
        loadingText.style.color = "#ff0000";
        isLoaded = true;
        
        // Build the game ONLY after the bar is done
        initGame(); 
    } else {
        progressBar.style.width = progress + '%';
        loadingText.innerText = "STABILIZING REALITY... " + Math.floor(progress) + "%";
        setTimeout(startLoadingBar, 30); // Use setTimeout for guaranteed visual updates
    }
}

// Start the bar immediately
startLoadingBar();

const handleEntry = (e) => {
    if (!isLoaded) return;
    if (e) e.preventDefault();

    loadingScreen.style.display = 'none';
    controls.style.display = 'block';
    
    bgMusic.play();
    // Prime audio
    footstepAudio.play().then(() => footstepAudio.pause());
    
    window.removeEventListener('touchstart', handleEntry);
    window.removeEventListener('click', handleEntry);
};

window.addEventListener('touchstart', handleEntry);
window.addEventListener('click', handleEntry);

function initGame() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.12);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    flashlight = new THREE.SpotLight(0xffffff, 80);
    flashlight.angle = Math.PI / 7;
    camera.add(flashlight);
    flashlight.position.set(0, 0, 1);
    flashlight.target = camera;
    scene.add(camera);

    create4000UnitMap();
    createSurgeon();
    setupJoystick();
    animate();
}

function create4000UnitMap() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x050505 });
    
    for (let i = 0; i < 400; i++) {
        const group = new THREE.Group();
        const zPos = -i * 10;

        const floor1 = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), floorMat);
        floor1.rotation.x = -Math.PI / 2;
        group.add(floor1);

        const lW = new THREE.Mesh(new THREE.BoxGeometry(0.2, 12, 10), wallMat);
        lW.position.set(-4, 6, 0);
        group.add(lW);

        const rW = new THREE.Mesh(new THREE.BoxGeometry(0.2, 12, 10), wallMat);
        rW.position.set(4, 6, 0);
        group.add(rW);

        const floor2 = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), floorMat);
        floor2.rotation.x = -Math.PI / 2;
        floor2.position.y = 5.5;
        group.add(floor2);

        if (i % 100 === 0 && i !== 0) {
            for(let s=0; s<11; s++){
                const step = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 1), wallMat);
                step.position.set(0, s*0.5, -s);
                group.add(step);
            }
        }

        group.position.z = zPos;
        scene.add(group);
        segments.push(group);
    }
}

function createSurgeon() {
    surgeon = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    const s = 0.35; 
    const head = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshLambertMaterial({color: 0x000}));
    const torso = new THREE.Mesh(new THREE.BoxGeometry(s, s*1.6, s), mat);
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(s/2, s, s/2), mat);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(s/2, s, s/2), mat);
    head.position.y = 0.8; torso.position.y = 0.4;
    lLeg.position.set(-0.1, 0, 0); rLeg.position.set(0.1, 0, 0);
    surgeon.add(head, torso, lLeg, rLeg);
    surgeon.position.set(0, 0, -25);
    scene.add(surgeon);
}

function handleImpermanence() {
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    if (!frustum.containsPoint(surgeon.position)) {
        surgeon.position.z += 0.1; 
        if(Math.random() > 0.99) surgeon.position.y = (Math.random() > 0.5) ? 5.5 : 0;
    }

    segments.forEach(seg => {
        if (!frustum.containsPoint(seg.position) && Math.abs(camera.position.z - seg.position.z) > 50) {
            if (Math.random() > 0.999) seg.scale.x = (Math.random() > 0.5) ? 0.5 : 1.0;
        }
    });
}

function setupJoystick() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    let active = false;
    const move = (e) => {
        if (!active) return;
        const t = e.touches ? e.touches[0] : e;
        const r = base.getBoundingClientRect();
        const dx = t.clientX - (r.left + r.width/2);
        const dy = t.clientY - (r.top + r.height/2);
        const d = Math.min(Math.sqrt(dx*dx + dy*dy), 45);
        const a = Math.atan2(dy, dx);
        stick.style.transform = `translate(${Math.cos(a)*d}px, ${Math.sin(a)*d}px)`;
        moveForward = -Math.sin(a) * (d/45) * 0.28;
        moveRight = Math.cos(a) * (d/45) * 0.28;
        isWalking = d > 8;
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
        camera.position.y = (camera.position.y > 3) ? 7.1 : 1.6; 
        camera.position.y += Math.sin(Date.now() * 0.01) * 0.05;
        if (footstepAudio.paused) footstepAudio.play();
    } else {
        footstepAudio.pause();
    }
    handleImpermanence();
    const t = Date.now() * 0.005;
    surgeon.children[2].rotation.x = Math.sin(t) * 0.5;
    surgeon.children[3].rotation.x = -Math.sin(t) * 0.5;
    renderer.render(scene, camera);
}
