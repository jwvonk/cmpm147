// sketch.js - Generative, living impression of Joshua Tree using p5.js
// Author: Joost Vonk
// Date: 4/16/2024

const HORIZON = 400;

function resizeScreen() {
  centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  // redrawCanvas(); // Redraw everything based on new size
}
/* exported setup, draw */
let seed = 0;

// Function to calculate displacement in the X direction based on mouseX position
function displacementX() {
  return (mouseX - width / 2) / (width / 2);
}

// Function to calculate displacement in the Y direction based on mouseY position
function displacementY() {
  return (mouseY - height / 2) / (height / 2);
}


// Function to generate random numbers following an exponential distribution
function randomExponential(min, lambda) {
  return -Math.log(1 - random()) / lambda + min;
}

// Class for drawing the sky
class Sky {
  constructor() {
    // Colors for the sky
    this.topColor = color('#2B345B');
    this.leftColors = [color('#4B4867'), color('#7E6F86'), color('#C7AFA5'), color('#E67F00')];
    this.rightColors = [color('#64537D'), color('#85687F'), color('#B58C88'), color('#E78872')];
    // Factors to control displacement intensity
    this.mouseFactor = 50;
    this.noiseFactor = 100;
  }

  // Method to draw the sky
  draw() {
    noStroke();
    // Draw top center band
    fill(this.topColor);
    rect(0, 0, width, HORIZON);

    // Draw bands
    for (let i = 0; i < max(this.leftColors.length, this.rightColors.length); i++) {
      if (i < this.leftColors.length) {
        fill(this.leftColors[i]);
        beginShape();
        vertex(0, HORIZON);
        vertex(0, (HORIZON * -1 / 3) + (HORIZON * i / this.leftColors.length) * 4 / 3 + this.bandOffsetY(i));
        vertex(width - (width * i / (this.leftColors.length - 1)) * 1 / 2 + this.bandOffsetX(i), HORIZON);
        endShape(CLOSE);
      }
      if (i < this.rightColors.length) {
        fill(this.rightColors[i]);
        beginShape();
        vertex(width, HORIZON);
        vertex(width, (HORIZON * -1 / 3) + (HORIZON * i / this.rightColors.length) * 4 / 3 + this.bandOffsetY(i));
        vertex( 0 + (width * i / (this.rightColors.length - 1)) * 1 / 2 + this.bandOffsetX(i), HORIZON);
        endShape(CLOSE);
      }
    }
  }

  // Method to calculate displacement in the X direction for bands
  bandOffsetX(index) {
    return this.noiseFactor * map(noise(millis() / 10000 + index + seed), 0, 1, -1, 1) + displacementX() * this.mouseFactor * (1 - index / (max(this.leftColors.length, this.rightColors.length)));
  }

  // Method to calculate displacement in the Y direction for bands
  bandOffsetY(index) {
    return this.noiseFactor * map(noise(millis() / 10000 + index + seed + 1000), 0, 1, -1, 1) + displacementY() * this.mouseFactor * (1 - index / (max(this.leftColors.length, this.rightColors.length)));
  }
}


// Class for drawing the hills
class Hills {
  constructor() {
    // Color and parameters for the hills
    this.color = color('#4B2905');
    this.baseAmplitude = 100;
    this.baseNoiseScale = 0.01;
    this.numPoints = 800;
    this.mouseFactor = .25; // Adjust this value to control the displacement intensity for hills
  }

  // Method to draw the hills
  draw() {
    noStroke();
    fill(this.color);

    beginShape();
    // Draw the hills using Perlin noise
    for (let i = 0; i < this.numPoints; i++) {
      let x = map(i, 0, this.numPoints - 1, width, 0);
      let amplitude = this.baseAmplitude * (1 - i / this.numPoints); // Adjusted amplitude
      let noiseScale = this.baseNoiseScale * (i / this.numPoints); // Adjusted noise scale
      let noiseValue = noise(i * noiseScale, seed);
      // Adjust y position based on mouse movement
      let y = map(noiseValue + displacementY() * this.mouseFactor, 0, 1, HORIZON - amplitude, HORIZON);
      vertex(x, y);
    }
    // Draw the left edge of the canvas
    vertex(0, height);
    // Draw the right edge of the canvas
    vertex(width, height);
    endShape(CLOSE);
  }
}

// Class for drawing the ground
class Ground {
  constructor() {
    // Color and parameters for the ground
    this.color = color('#9A4807');
    this.grassColor = color('#EE8907');
    this.numGrass = 1000;
  }

  // Method to draw the ground
  draw() {
    noStroke();
    // Draw ground
    fill(this.color);
    rect(0, HORIZON, width, height - HORIZON);

    // Draw grass
    fill(this.grassColor);
    for (let i = 0; i < this.numGrass; i++) {
      let x = random(width); // Random x position
      let y = min(randomExponential(HORIZON, .04), height - 20);
      let scaleFactor = map(y, HORIZON, height - 20, 1, 5); // Scale factor based on y position
      let grassWidth = random(10, 20) * scaleFactor; // Random grass width
      let grassHeight = random(5, 10) * scaleFactor; // Random grass height
      ellipse(x, y, grassWidth, grassHeight); // Draw oval grass blade
    }
  }
}

// Class for drawing the trees
class Trees {
  constructor() {
    // Colors and parameters for the trees
    this.trunkColor = '#955508';
    this.foliageColor = '#A98300';
    this.numTrees = 20;
    this.mouseFactor = .25; // Adjust this value to control the displacement intensity for trees
  }

  // Method to draw the trees
  draw() {
    for (let i = 0; i < this.numTrees; i++) {
      let x = random(width); // Random x position
      let y = min(randomExponential(HORIZON + 20, .03), height - 20);
      let scaleFactor = map(y, HORIZON + 20, height - 20, .4, 5); // Scale factor based on y position
      let depth = 5;
      this.drawTree(x, y, depth, scaleFactor);
    }
  }

  // Method to draw a single tree
  drawTree(x, y, depth, scaleFactor) {
    let trunkAngle = randomGaussian(-HALF_PI, PI / 24) + displacementX() * this.mouseFactor;
    let trunkLength = randomGaussian(40 * scaleFactor, 10 * scaleFactor);
    this.drawTrunk(x, y, trunkLength, trunkAngle, depth, scaleFactor);
  }

  // Method to draw the trunk of a tree
  drawTrunk(x, y, length, angle, depth, scaleFactor) {
    if (depth === 0) {
      this.drawFoliage(x, y, scaleFactor);
      return;
    }
    strokeWeight(5 * scaleFactor);

    // Draw trunk segment
    let endX = x + cos(angle) * length;
    let endY = y + sin(angle) * length;
    stroke(this.trunkColor);
    line(x, y, endX, endY);

    // Determine the number of branches
    let s = random();
    let branchCount;
    if (s < 0.4) {
      branchCount = depth === this.depth ? 2 : 1;
    } else if (s < 0.9) {
      branchCount = 2;
    } else {
      branchCount = 3;
    }

    // Draw branches
    for (let i = 0; i < branchCount; i++) {
      let arcLength = 8 * PI / 9 / branchCount;
      let newAngle = max(-HALF_PI + randomGaussian((-4 * PI / 9) + arcLength / 2 + arcLength * i, -PI / 9), -PI);
      newAngle = min(newAngle, 0);
      let newLength = max(randomGaussian(10 * scaleFactor, 5 * scaleFactor), 5 * scaleFactor);
      let newDepth = depth - 1;
      this.drawTrunk(endX, endY, newLength, newAngle, newDepth, scaleFactor);
    }
  }

  // Method to draw the foliage of a tree
  drawFoliage(x, y, scaleFactor) {
    strokeWeight(1 * scaleFactor);
    stroke(this.foliageColor);
    let numSpikes = 30;
    let spikeLength = 7 * scaleFactor;
    for (let i = 0; i < numSpikes; i++) {
      let spikeAngle = random(TWO_PI);
      let spikeEndX = x + cos(spikeAngle) * spikeLength;
      let spikeEndY = y + sin(spikeAngle) * spikeLength;
      line(x, y, spikeEndX, spikeEndY);
    }
  }
}

let sky, ground, hills, trees;

// setup() function is called once when the program starts
function setup() {
  // place our canvas, making it fit our container
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");

  sky = new Sky();
  hills = new Hills();
  ground = new Ground();
  trees = new Trees();

  reimagineContainer = $("#reimagine-container");
  let button = createButton("reimagine");
  button.mousePressed(() => seed++);
  button.parent("reimagine-container");

  // resize canvas is the page is resized
  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();
}

// draw() function is called repeatedly, it's the main animation loop
function draw() {
  randomSeed(seed);
  background(0);
  sky.draw();
  hills.draw();
  ground.draw();
  trees.draw();
}
