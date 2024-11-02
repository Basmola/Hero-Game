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
const heroDistanceFromEdge = 10; // While waiting
const paddingX = 100; // The waiting position of the hero in from the original canvas size
const perfectAreaSize = 10;

// The background moves slower than the hero
const backgroundSpeedMultiplier = 0.2;

const hill1BaseHeight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;

const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17; // 24
const heroHeight = 30; // 40

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
// Resets game variables and layouts but does not start the game (game starts on keypress)
function resetGame() {
    // Reset game progress
    phase = "waiting";
    lastTimestamp = undefined;
    sceneOffset = 0;
    score = 0;
  
    introductionElement.style.opacity = 1;
    perfectElement.style.opacity = 0;
    restartButton.style.display = "none";
    scoreElement.innerText = score;
  
    // The first platform is always the same
    // x + w has to match paddingX
    platforms = [{ x: 50, w: 50 }];
    generatePlatform();
    generatePlatform();
    generatePlatform();
    generatePlatform();
    trees = [];
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
    heroY = 0;
    draw();}
    function generateTree() {
    const minimumGap = 30;
    const maximumGap = 150;

    // X coordinate of the right edge of the furthest tree
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
  
    // X coordinate of the right edge of the furthest platform
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
  
  resetGame();
  
  // If space was pressed restart the game
  window.addEventListener("keydown", function (event) {
    if (event.key == " ") {
      event.preventDefault();
      resetGame();
      return;
    }
  });
  

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
  
    if (average > 30 && phase === "waiting") { // Trigger jump only when in "waiting" phase
        jump();
    }
  }
  function getJumpAngle() {
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume level
    const avgVolume =
      dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

    // Map volume to angle (e.g., volume range 0-255 mapped to angle 20-60)
    const minAngle = 20;
    const maxAngle = 60;
    return minAngle + ((avgVolume / 255) * (maxAngle - minAngle));
  }

  function jump() {
    getJumpAngle();
    if (phase === "waiting") { // Only allow jump when waiting
        phase = "jumping";
        
        // Parameters for jump physics
        const initialVelocity = 5; // Initial jump speed
        const jumpAngle = 45; // Angle in degrees
        const gravity = 0.2; // Gravity affecting the fall speed

        // Convert angle to radians for calculations
        const angleInRadians = jumpAngle * (Math.PI / 180);

        // Calculate the initial horizontal and vertical velocities
        const velocityX = initialVelocity * Math.cos(angleInRadians);
        const velocityY = -initialVelocity * Math.sin(angleInRadians);

        // Variables to track current velocities and position
        let currentVelocityY = velocityY;
        let currentX = heroX;
        let currentY = heroY;
        let startTime = performance.now();

        function animateJump(timestamp) {
            const elapsed = timestamp - startTime;

            // Calculate the new position
            currentX += velocityX; // Move horizontally with constant speed
            currentVelocityY += gravity; // Apply gravity to the vertical velocity
            currentY += currentVelocityY; // Move vertically based on velocity and gravity

            // Set the hero’s current position
            heroX = currentX;
            heroY = currentY;

            // Redraw the game screen with the new position
            draw();

            // Stop the jump when the hero reaches the ground level
            if (heroY >= 0) { 
                heroY = 0; // Reset to ground level
                phase = "waiting"; // Allow another jump
                return; // Exit the animation loop
            }

            requestAnimationFrame(animateJump); // Continue animation
        }

        requestAnimationFrame(animateJump); // Start the jump animation
    }
   
}

window.addEventListener("resize", function (event) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  });
  
  window.requestAnimationFrame(animate);
  
  // The main game loop
  function animate(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
      window.requestAnimationFrame(animate);
      return;
    }
  
    switch (phase) {
      case "waiting":
        return; // Stop the loop
      case "stretching": {
        sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
        break;
      }
      case "turning": {
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
  
        if (sticks.last().rotation > 90) {
          sticks.last().rotation = 90;
  
          const [nextPlatform, perfectHit] = thePlatformTheStickHits();
          if (nextPlatform) {
            // Increase score
            score += perfectHit ? 2 : 1;
            scoreElement.innerText = score;
  
            if (perfectHit) {
              perfectElement.style.opacity = 1;
              setTimeout(() => (perfectElement.style.opacity = 0), 1000);
            }
  
            generatePlatform();
            generateTree();
            generateTree();
          }
  
          phase = "walking";
        }
        break;
      }
      case "walking": {
        heroX += (timestamp - lastTimestamp) / walkingSpeed;
  
        const [nextPlatform] = thePlatformTheStickHits();
        if (nextPlatform) {
          // If hero will reach another platform then limit it's position at it's edge
          const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
          if (heroX > maxHeroX) {
            heroX = maxHeroX;
            phase = "transitioning";
          }
        } else {
          // If hero won't reach another platform then limit it's position at the end of the pole
          const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
          if (heroX > maxHeroX) {
            heroX = maxHeroX;
            phase = "falling";
          }
        }
        break;
      }
      case "transitioning": {
        sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;
  
        const [nextPlatform] = thePlatformTheStickHits();
        if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
          // Add the next step
          sticks.push({
            x: nextPlatform.x + nextPlatform.w,
            length: 0,
            rotation: 0
          });
          phase = "waiting";
        }
        break;
      }
      case "falling": {
        if (sticks.last().rotation < 180)
          sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
  
        heroY += (timestamp - lastTimestamp) / fallingSpeed;
        const maxHeroY =
          platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
        if (heroY > maxHeroY) {
          restartButton.style.display = "block";
          return;
        }
        break;
      }
      default:
        throw Error("Wrong phase");
    }
  
    draw();
    window.requestAnimationFrame(animate);
  
    lastTimestamp = timestamp;
  }
  
  // Returns the platform the stick hit (if it didn't hit any stick then return undefined)
  function thePlatformTheStickHits() {
    if (sticks.last().rotation != 90)
      throw Error(`Stick is ${sticks.last().rotation}°`);
    const stickFarX = sticks.last().x + sticks.last().length;
  
    const platformTheStickHits = platforms.find(
      (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
    );
  
    // If the stick hits the perfect area
    if (
      platformTheStickHits &&
      platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
        stickFarX &&
      stickFarX <
        platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
    )
      return [platformTheStickHits, true];
  
    return [platformTheStickHits, false];
  }
  

// Drawing functions


function draw() {
    ctx.save();  // calling it to apply transformations and styles without permanently changing the canvas’s default state
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); //need to clear the previous frame before drawing the new one.

    drawBackground();

    // Center main canvas area to the middle of the screen
    ctx.translate((window.innerWidth - canvasWidth) / 2 - sceneOffset, (window.innerHeight - canvasHeight) / 2);  //repositions(x,y)

    // Draw scene
    drawPlatforms();
    drawHero();
    // Restore transformation
    ctx.restore();
}
restartButton.addEventListener("click", function (event) {
    event.preventDefault();
    resetGame();
    restartButton.style.display = "none";
});

function drawPlatforms() {
    platforms.forEach(({ x, w }) => { //x for The x-coordinate of the platform's left edge and w The width of the platform.
      // Draw platform
        ctx.fillStyle = "black";
        ctx.fillRect(x,canvasHeight - platformHeight,w,platformHeight + (window.innerHeight - canvasHeight) / 2);

      // Draw red small rectangle only if hero did not yet reach the platform

    });
}

function drawHero() {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.translate(heroX - heroWidth / 2,heroY + canvasHeight - platformHeight - heroHeight / 2);

    // Body
    drawRoundedRect(-heroWidth / 2,-heroHeight / 2,heroWidth,heroHeight - 4,5);

    // Legs
    const legDistance = 5; //distance between two legs is 5
    //right leg
    ctx.beginPath(); 
    ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);//(x,y,raduis,start and end angles(full circle),Indicates the arc is drawn in a clockwise direction)
    ctx.fill();
    //left leg
    ctx.beginPath();  // This starts a new path,ensuring that it is independent of other shapes.
    ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);//(-5 so it would lefted from center of hero,rest remains the same as right leg)
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(5, -7, 3, 0, Math.PI * 2, false); //-7  positions the eye above the middle of the hero's body
    ctx.fill();

    // Band
    ctx.fillStyle = "red";
    //Headband Base
    ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
    //First Triangle Tail
    ctx.beginPath();
    ctx.moveTo(-9, -14.5); //moves to the starting point of the first tail, positioned to the left of the headband’s center.
    ctx.lineTo(-17, -18.5);//creating a slanted tail.
    ctx.lineTo(-14, -8.5); //Draws a line downwards to another point, forming a small triangle shape.
    ctx.fill();
    //Second Triangle Tail
    ctx.beginPath();
    ctx.moveTo(-10, -10.5);
    ctx.lineTo(-15, -3.5);
    ctx.lineTo(-5, -7);
    ctx.fill();
    ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius); //Top Left Corner with Radius Offset
    ctx.lineTo(x, y + height - radius); //Draw the Left Side
    ctx.arcTo(x, y + height, x + radius, y + height, radius); //Bottom-Left Corner (Rounded)
    ctx.lineTo(x + width - radius, y + height); //Draw the Bottom Side
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);//Bottom-Right Corner (Rounded)
    ctx.lineTo(x + width, y + radius);//Draw the Right Side
    ctx.arcTo(x + width, y, x + width - radius, y, radius);//Top-Right Corner (Rounded)
    ctx.lineTo(x + radius, y);//Draw the Top Side
    ctx.arcTo(x, y, x, y + radius, radius);//Top-Left Corner (Rounded)
    ctx.fill(); //Fills the entire rounded rectangle shape with the current fillStyle color which is black
}

function drawBackground() {
    // Draw sky
    var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);//(x,y,width,height)
    gradient.addColorStop(0, "#BBD691");//Sets the first color at the top of the gradient to a light green
    gradient.addColorStop(1, "#FEF1E1");//Sets the second color at the bottom of the gradient to a cream shade
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    // Draw hills
    drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
    drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");
    // Draw trees
    trees.forEach((tree) => drawTree(tree.x, tree.color));
}

  // A hill is a shape under a stretched out sin wave
function drawHill(baseHeight, amplitude, stretch, color) {
    ctx.beginPath();
    ctx.moveTo(0, window.innerHeight); // Moves the cursor to a new position without drawing.
    ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch)); //Draws a line from the current position to (x, y)
    for (let i = 0; i < window.innerWidth; i++) {
        ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
    }
    ctx.lineTo(window.innerWidth, window.innerHeight);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawTree(x, color) {
    ctx.save();
    ctx.translate((-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,getTreeY(x, hill1BaseHeight, hill1Amplitude));

    const treeTrunkHeight = 5;
    const treeTrunkWidth = 2;
    const treeCrownHeight = 25;
    const treeCrownWidth = 10;

    // Draw trunk (rectangle) 
    ctx.fillStyle = "#7D833C"; // brownish color for the tree trunk
    ctx.fillRect(-treeTrunkWidth / 2,-treeTrunkHeight,treeTrunkWidth,treeTrunkHeight);//Draws the trunk as a small rectangle centered on the translated x position

    // Draw crown (triangle)
    ctx.beginPath();
    ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);// Moves to the left side of the crown at the top of the trunk.
    ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));//Draws a line to the peak of the crown, positioned above the trunk by the crown height.
    ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);//Draws a line to the right side of the crown, completing the triangle shape.
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
}

//makes it look like the hill has a smooth wave-like shape
function getHillY(windowX, baseHeight, amplitude, stretch) {
    const sineBaseY = window.innerHeight - baseHeight;//ensures the hill starts at a fixed height above the bottom of the screen.
    return (Math.sin((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) * amplitude +sineBaseY);
}

//Returns the y position for a tree placed along the hill based on its x position.
function getTreeY(x, baseHeight, amplitude) {
    const sineBaseY = window.innerHeight - baseHeight;
    return Math.sin(x) * amplitude + sineBaseY;
}

