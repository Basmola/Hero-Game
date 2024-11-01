// Extend the base functionality of JavaScript
Array.prototype.last = function () {
    return this[this.length - 1];
};

// A sinus function that accepts degrees instead of radians
Math.sinus = function (degree) {
    return Math.sin((degree / 180) * Math.PI);
};

// Game data
let phase = "waiting"; // waiting | jumping | stretching | turning | walking | transitioning | falling
let lastTimestamp;
let heroX;
let heroY;
let sceneOffset;

let platforms = [];
let sticks = [];
let trees = [];

let score = 0;

// Configuration
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10;
const paddingX = 100;
const perfectAreaSize = 10;

const backgroundSpeedMultiplier = 0.2;

const stretchingSpeed = 4;
const turningSpeed = 4;
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17;
const heroHeight = 30;

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

// Initialize layout
resetGame();

// Resets game variables and layouts but does not start the game (game starts on keypress)
function resetGame() {
    phase = "waiting";
    lastTimestamp = undefined;
    sceneOffset = 0;
    score = 0;

    introductionElement.style.opacity = 1;
    perfectElement.style.opacity = 0;
    restartButton.style.display = "none";
    scoreElement.innerText = score;

    platforms = [{ x: 50, w: 50 }];
    generatePlatform();
    generatePlatform();
    generatePlatform();
    generatePlatform();

    sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

    trees = [];
    for (let i = 0; i < 9; i++) generateTree();

    heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
    heroY = 0;

    draw();
}

function generateTree() {
    const minimumGap = 30;
    const maximumGap = 150;
    const lastTree = trees[trees.length - 1];
    let furthestX = lastTree ? lastTree.x : 0;

    const x =
        furthestX +
        minimumGap +
        Math.floor(Math.random() * (maximumGap - minimumGap));

    const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
    const color = treeColors[Math.floor(Math.random() * 3)];

    trees.push({ x, color });
}

function generatePlatform() {
    const minimumGap = 40;
    const maximumGap = 200;
    const minimumWidth = 20;
    const maximumWidth = 100;

    const lastPlatform = platforms[platforms.length - 1];
    let furthestX = lastPlatform.x + lastPlatform.w;

    const x =
        furthestX +
        minimumGap +
        Math.floor(Math.random() * (maximumGap - minimumGap));
    const w =
        minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

    platforms.push({ x, w });
}


document.getElementById("startButton").addEventListener("click", async function () {
    await setupAudio();
    resetGame(); // Start the game
});

// Audio setup
let audioContext;
let analyser;
let microphone;
let dataArray;
document.getElementById("startButton").addEventListener("click", async function () {
    await setupAudio();
    resetGame(); // Start the game
});

async function setupAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Resume the audio context if it's suspended
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    try {
        microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(microphone);
        source.connect(analyser);
        detectSound();
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}


function detectSound() {
    requestAnimationFrame(detectSound);

    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((sum, value) => sum + value) / dataArray.length;

    console.log("Average sound level:", average); // Log sound level

    if (average > 20) { // Adjust this threshold as needed
        jump();
    }
}


function jump() {
    if (phase === "waiting") {
        phase = "jumping";
        heroY -= 100; // Jump height
        setTimeout(() => {
            heroY += 100; // Return to original position
            phase = "waiting"; // Reset phase
        }, 300); // Duration of jump
    }
}


// Drawing functions

function draw() {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawBackground();

    ctx.translate(
        (window.innerWidth - canvasWidth) / 2 - sceneOffset,
        (window.innerHeight - canvasHeight) / 2
    );

    drawPlatforms();
    drawHero();
    drawSticks();

    ctx.restore();
}

restartButton.addEventListener("click", function (event) {
    event.preventDefault();
    resetGame();
    restartButton.style.display = "none";
});

function drawPlatforms() {
    platforms.forEach(({ x, w }) => {
        ctx.fillStyle = "black";
        ctx.fillRect(
            x,
            canvasHeight - platformHeight,
            w,
            platformHeight + (window.innerHeight - canvasHeight) / 2
        );

        if (sticks.last().x < x) {
            ctx.fillStyle = "red";
            ctx.fillRect(
                x + w / 2 - perfectAreaSize / 2,
                canvasHeight - platformHeight,
                perfectAreaSize,
                perfectAreaSize
            );
        }
    });
}

function drawHero() {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.translate(
        heroX - heroWidth / 2,
        heroY + canvasHeight - platformHeight - heroHeight / 2
    );

    drawRoundedRect(-heroWidth / 2, -heroHeight / 2, heroWidth, heroHeight - 4, 5);
    
    const legDistance = 5;
    ctx.beginPath();
    ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.fillStyle = "red";
    ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
    ctx.beginPath();
    ctx.moveTo(-9, -14.5);
    ctx.lineTo(-17, -18.5);
    ctx.lineTo(-14, -8.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, -10.5);
    ctx.lineTo(-15, -3.5);
    ctx.lineTo(-5, -7);
    ctx.fill();

    ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
}

function drawSticks() {
    sticks.forEach((stick) => {
        ctx.save();
        ctx.translate(stick.x, canvasHeight - platformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();

        ctx.restore();
    });
}

function drawBackground() {
    var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
    gradient.addColorStop(0, "#BBD691");
    gradient.addColorStop(1, "#FEF1E1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}
