// sketch.js - Evolutionary Impressions of Giza, Venus, and Monument Valley using p5.js
// Author: Joost Vonk
// Date: 5/8/2024

/* exported getInspirations, initDesign, renderDesign, mutateDesign */

function getInspirations() {
  return [
    {
      name: "Giza",
      assetUrl:
        "https://cdn.glitch.global/ab1553e6-67cc-4a4e-b179-195f78b6555c/giza.png?v=1715117985636",
      credit: "http://giza.fas.harvard.edu/gizaintro/",
      shape: "Tri",
      bg: color(253, 213, 145), // Sand
      colors: [
        color(183, 118, 46), // Dark Pyramid
        color(244, 188, 98), // Light Pyramid
        color(253, 213, 145), // Sand
        color(192, 197, 203), // Clouds
        color(0, 100, 151), // Sky
      ]
    },
    {
      name: "Venus",
      assetUrl:
        "https://cdn.glitch.global/ab1553e6-67cc-4a4e-b179-195f78b6555c/venus.png?v=1715147594103",
      credit:
        "Valery Hache, https://www.nationalgeographic.com/culture/article/140412-moon-faces-brain-culture-space-neurology",
      shape: "Ellipse",
      bg: color(2, 1, 1), // Space
      colors: [
        color(228, 195, 111), // Pale Yellow
        color(0, 0, 0), // Black
        color(0, 0, 0), // Black
        color(0, 0, 0), // Black
        color(0, 0, 0), // Black
        color(0, 0, 0), // Black
        color(130, 57, 14), // Reddish Brown
        color(180, 98, 18) // Orange
      ]
    },
    {
      name: "Monument Valley",
      assetUrl:
        "https://cdn.glitch.global/ab1553e6-67cc-4a4e-b179-195f78b6555c/monument-valley.png?v=1715148283061",
      credit:
        "Monochrome Mittens, Alexander S. Kunz, 2018, https://www.alex-kunz.com/monument-valley/",
      shape: "Rect",
      bg: color(71, 48, 47), // Reddish Dirt
      colors: [
        color(71, 48, 47), // Reddish Dirt
        color(71, 48, 47), // Reddish Dirt
        color(71, 48, 47), // Reddish Dirt
        color(165, 53, 9), // Red Monument
        color(63, 117, 149), // Blue Sky
        color(63, 117, 149), // Blue Sky
        color(162, 119, 102), //Yellow Sky
      ]
    },
  ];
}

function initDesign(inspiration) {
  resizeCanvas(inspiration.image.width / 4, inspiration.image.height / 4);
  let c = inspiration.bg
  let design = {
    bgr: c.levels[0],
    bgg: c.levels[1],
    bgb: c.levels[2],
    fg: [],
  };
  

  for (let i = 0; i < 2000; i++) {
    let c = random(inspiration.colors);
    console.log(c.levels[0]);
    // color.setAlpha(random(0, 200));
    design.fg.push({
      x: random(width),
      y: random(height),
      w: random(width / 8, width / 2),
      h: random(height / 8, height / 2),
      r: c.levels[0],
      g: c.levels[1],
      b: c.levels[2],
      p: random(-PI, PI),
      a: random(255),
    });
  }
  return design;
}

function renderDesign(design, inspiration) {
  background(color(design.bgr, design.bgg, design.bgb));
  noStroke();
  ellipseMode(CENTER);
  rectMode(CENTER);
  for (let shape of design.fg) {
    push()
    translate(shape.x, shape.y);
    fill(color(shape.r, shape.g, shape.b, shape.a));
    switch (inspiration.shape) {
      case "Rect":
        rect(0, 0, shape.w, shape.h);
        break;
      case "Ellipse":
        ellipse(0, 0, shape.w, shape.h);
        break;
      case "Tri":
        drawTriangle(0, 0, shape.w, shape.h);
    }
    pop()
  }
}

function drawTriangle(x, y, tWidth, tHeight) {
  let halfHeight = tHeight / 2;
  let halfWidth = tWidth / 2;

  // Calculate vertices
  let x1 = x - halfWidth;
  let y1 = y + halfHeight;
  let x2 = x + halfWidth;
  let y2 = y + halfHeight;
  let x3 = x;
  let y3 = y - halfHeight;

  // Draw triangle
  triangle(x1, y1, x2, y2, x3, y3);
}

function mutateDesign(design, inspiration, rate) {
  for (let shape of design.fg) {
    shape.x = mut(shape.x, 0, width, rate);
    shape.y = mut(shape.y, 0, height, rate);
    shape.w = mut(shape.w, width / 8, width / 2, rate);
    shape.h = mut(shape.h, height / 8, height / 2, rate);
    shape.p = mut(shape.p, -PI, PI, rate);
    shape.a = mut(shape.a, 0, 255, rate);
  }
}

function mut(num, min, max, rate) {
  return constrain(randomGaussian(num, (rate * (max - min)) / 10), min, max);
}

/* exported preload, setup, draw */
/* global memory, dropper, restart, rate, slider, activeScore, bestScore, fpsCounter */
/* global getInspirations, initDesign, renderDesign, mutateDesign */

let bestDesign;
let currentDesign;
let currentScore;
let currentInspiration;
let currentCanvas;
let currentInspirationPixels;

function preload() {
  

  let allInspirations = getInspirations();

  for (let i = 0; i < allInspirations.length; i++) {
    let insp = allInspirations[i];
    insp.image = loadImage(insp.assetUrl);
    let option = document.createElement("option");
    option.value = i;
    option.innerHTML = insp.name;
    dropper.appendChild(option);
  }
  dropper.onchange = e => inspirationChanged(allInspirations[e.target.value]);
  currentInspiration = allInspirations[0];

  restart.onclick = () =>
    inspirationChanged(allInspirations[dropper.value]);
}

function inspirationChanged(nextInspiration) {
  currentInspiration = nextInspiration;
  currentDesign = undefined;
  memory.innerHTML = "";
  setup();
}



function setup() {
  currentCanvas = createCanvas(width, height);
  currentCanvas.parent(document.getElementById("active"));
  currentScore = Number.NEGATIVE_INFINITY;
  currentDesign = initDesign(currentInspiration);
  bestDesign = currentDesign;
  image(currentInspiration.image, 0,0, width, height);
  loadPixels();
  currentInspirationPixels = pixels;
}

function evaluate() {
  loadPixels();

  let error = 0;
  let n = pixels.length;
  
  for (let i = 0; i < n; i++) {
    error += sq(pixels[i] - currentInspirationPixels[i]);
  }
  return 1/(1+error/n);
}



function memorialize() {
  let url = currentCanvas.canvas.toDataURL();

  let img = document.createElement("img");
  img.classList.add("memory");
  img.src = url;
  img.width = width;
  img.heigh = height;
  img.title = currentScore;

  document.getElementById("best").innerHTML = "";
  document.getElementById("best").appendChild(img.cloneNode());

  img.width = width / 2;
  img.height = height / 2;

  memory.insertBefore(img, memory.firstChild);

  if (memory.childNodes.length > memory.dataset.maxItems) {
    memory.removeChild(memory.lastChild);
  }
}

let mutationCount = 0;

function draw() {
  
  if(!currentDesign) {
    return;
  }
  randomSeed(mutationCount++);
  currentDesign = JSON.parse(JSON.stringify(bestDesign));
  rate.innerHTML = slider.value;
  mutateDesign(currentDesign, currentInspiration, slider.value/100.0);
  
  randomSeed(0);
  renderDesign(currentDesign, currentInspiration);
  let nextScore = evaluate();
  activeScore.innerHTML = nextScore;
  if (nextScore > currentScore) {
    currentScore = nextScore;
    bestDesign = currentDesign;
    memorialize();
    bestScore.innerHTML = currentScore;
  }
  
  fpsCounter.innerHTML = Math.round(frameRate());
}
