// sketch.js - Alternate Worlds
// Author: Joost Vonk
// Date: 5/1/24

// Project base code provided by {amsmith,ikarth}@ucsc.edu
// Thanks to Alex Leghart for the help integrating these sketches into one
"use strict";

window.addEventListener(
  "keydown",
  function (e) {
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(
        e.code
      ) > -1
    ) {
      e.preventDefault();
    }
  },
  false
);

const w1 = (sketch) => {
  sketch.tile_width_step_main; // A width step is half a tile's width
  sketch.tile_height_step_main; // A height step is half a tile's height

  // Global variables. These will mostly be overwritten in setup().
  sketch.tile_rows, sketch.tile_columns;
  sketch.camera_offset;
  sketch.camera_velocity;

  /////////////////////////////
  // Transforms between coordinate systems
  // These are actually slightly weirder than in full 3d...
  /////////////////////////////
  sketch.worldToScreen = ([world_x, world_y], [camera_x, camera_y]) => {
    let i = (world_x - world_y) * sketch.tile_width_step_main;
    let j = (world_x + world_y) * sketch.tile_height_step_main;
    return [i + camera_x, j + camera_y];
  };

  sketch.worldToCamera = ([world_x, world_y], [camera_x, camera_y]) => {
    let i = (world_x - world_y) * sketch.tile_width_step_main;
    let j = (world_x + world_y) * sketch.tile_height_step_main;
    return [i, j];
  };

  sketch.tileRenderingOrder = (offset) => {
    return [offset[1] - offset[0], offset[0] + offset[1]];
  };

  sketch.screenToWorld = ([screen_x, screen_y], [camera_x, camera_y]) => {
    screen_x -= camera_x;
    screen_y -= camera_y;
    screen_x /= sketch.tile_width_step_main * 2;
    screen_y /= sketch.tile_height_step_main * 2;
    screen_y += 0.5;
    return [Math.floor(screen_y + screen_x), Math.floor(screen_y - screen_x)];
  };

  sketch.cameraToWorldOffset = ([camera_x, camera_y]) => {
    let world_x = camera_x / (sketch.tile_width_step_main * 2);
    let world_y = camera_y / (sketch.tile_height_step_main * 2);
    return { x: Math.round(world_x), y: Math.round(world_y) };
  };

  sketch.worldOffsetToCamera = ([world_x, world_y]) => {
    let camera_x = world_x * (sketch.tile_width_step_main * 2);
    let camera_y = world_y * (sketch.tile_height_step_main * 2);
    return new p5.Vector(camera_x, camera_y);
  };

  sketch.preload = () => {
    if (sketch.p3_preload) {
      sketch.p3_preload();
    }
  };

  sketch.setup = () => {
    let canvas = sketch.createCanvas(800, 400);
    canvas.parent("canvasContainer1");

    sketch.camera_offset = new p5.Vector(-sketch.width / 2, sketch.height / 2);
    sketch.camera_velocity = new p5.Vector(0, 0);

    if (sketch.p3_setup) {
      sketch.p3_setup();
    }

    sketch.rebuildWorld("xyzzy");
  };

  sketch.rebuildWorld = (key) => {
    if (sketch.p3_worldKeyChanged) {
      sketch.p3_worldKeyChanged(key);
    }
    sketch.tile_width_step_main = sketch.p3_tileWidth
      ? sketch.p3_tileWidth()
      : 32;
    sketch.tile_height_step_main = sketch.p3_tileHeight
      ? sketch.p3_tileHeight()
      : 14.5;
    sketch.tile_columns = Math.ceil(
      sketch.width / (sketch.tile_width_step_main * 2)
    );
    sketch.tile_rows = Math.ceil(
      sketch.height / (sketch.tile_height_step_main * 2)
    );
  };

  sketch.mouseClicked = () => {
    let world_pos = sketch.screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [sketch.camera_offset.x, sketch.camera_offset.y]
    );

    if (sketch.p3_tileClicked) {
      sketch.p3_tileClicked(world_pos[0], world_pos[1]);
    }
    return false;
  };

  sketch.draw = () => {
    // Keyboard controls!
    if (sketch.keyIsDown(sketch.LEFT_ARROW)) {
      sketch.camera_velocity.x -= 1;
    }
    if (sketch.keyIsDown(sketch.RIGHT_ARROW)) {
      sketch.camera_velocity.x += 1;
    }
    if (sketch.keyIsDown(sketch.DOWN_ARROW)) {
      sketch.camera_velocity.y -= 1;
    }
    if (sketch.keyIsDown(sketch.UP_ARROW)) {
      sketch.camera_velocity.y += 1;
    }

    let camera_delta = new p5.Vector(0, 0);
    sketch.camera_velocity.add(camera_delta);
    sketch.camera_offset.add(sketch.camera_velocity);
    sketch.camera_velocity.mult(0.95); // cheap easing
    if (sketch.camera_velocity.mag() < 0.01) {
      sketch.camera_velocity.setMag(0);
    }

    let world_pos = sketch.screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [sketch.camera_offset.x, sketch.camera_offset.y]
    );
    let world_offset = sketch.cameraToWorldOffset([
      sketch.camera_offset.x,
      sketch.camera_offset.y,
    ]);

    sketch.background(100);

    if (sketch.p3_drawBefore) {
      sketch.p3_drawBefore();
    }

    let overdraw = 0.1;

    let y0 = Math.floor((0 - overdraw) * sketch.tile_rows);
    let y1 = Math.floor((1 + overdraw) * sketch.tile_rows);
    let x0 = Math.floor((0 - overdraw) * sketch.tile_columns);
    let x1 = Math.floor((1 + overdraw) * sketch.tile_columns);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        sketch.drawTile(
          sketch.tileRenderingOrder([x + world_offset.x, y - world_offset.y]),
          [sketch.camera_offset.x, sketch.camera_offset.y]
        ); // odd row
      }
      for (let x = x0; x < x1; x++) {
        sketch.drawTile(
          sketch.tileRenderingOrder([
            x + 0.5 + world_offset.x,
            y + 0.5 - world_offset.y,
          ]),
          [sketch.camera_offset.x, sketch.camera_offset.y]
        ); // even rows are offset horizontally
      }
    }

    sketch.describeMouseTile(world_pos, [
      sketch.camera_offset.x,
      sketch.camera_offset.y,
    ]);

    if (sketch.p3_drawAfter) {
      sketch.p3_drawAfter();
    }
  };

  // Display a discription of the tile at world_x, world_y.
  sketch.describeMouseTile = ([world_x, world_y], [camera_x, camera_y]) => {
    let [screen_x, screen_y] = sketch.worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    sketch.drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
  };

  sketch.drawTileDescription = ([world_x, world_y], [screen_x, screen_y]) => {
    sketch.push();
    sketch.translate(screen_x, screen_y);
    if (sketch.p3_drawSelectedTile) {
      sketch.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
    }
    sketch.pop();
  };

  // Draw a tile, mostly by calling the user's drawing code.
  sketch.drawTile = ([world_x, world_y], [camera_x, camera_y]) => {
    let [screen_x, screen_y] = sketch.worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    sketch.push();
    sketch.translate(0 - screen_x, screen_y);
    if (sketch.p3_drawTile) {
      sketch.p3_drawTile(world_x, world_y, -screen_x, screen_y);
    }
    sketch.pop();
  };

  sketch.lastFrameTime = 0; // Variable to store the time of the last frame
  sketch.deltaTime = 0;

  sketch.p3_preload = () => {};

  sketch.p3_setup = () => {};

  sketch.worldSeed;
  sketch.frontSailColor;
  sketch.backSailColor;

  sketch.p3_worldKeyChanged = (key) => {
    sketch.worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(sketch.worldSeed);
    sketch.randomSeed(sketch.worldSeed);
    sketch.frontSailColor = sketch.color(
      sketch.random(255),
      sketch.random(255),
      sketch.random(255)
    );
    sketch.backSailColor = sketch.color(
      sketch.random(255),
      sketch.random(255),
      sketch.random(255)
    );
  };

  sketch.p3_tileWidth = () => {
    return 32;
  };

  sketch.p3_tileHeight = () => {
    return 16;
  };

  [sketch.tw, sketch.th] = [sketch.p3_tileWidth(), sketch.p3_tileHeight()];

  class Ripple {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.rippleDist = 0;
      this.initialStrength = 50;
      this.strength = 50;
      this.rippleWidth = 3;
      this.rippleSpeed = 0.01;
    }

    // Method to update the ripple's strength and age
    update() {
      this.rippleDist += this.radius * this.rippleSpeed;
      this.strength =
        this.initialStrength * ((this.radius - this.rippleDist) / this.radius);

      // Update rippleOffsets based on the influence of active ripples
      for (let x = this.x - this.radius; x <= this.x + this.radius; x++) {
        for (let y = this.y - this.radius; y <= this.y + this.radius; y++) {
          let distance = sketch.dist(this.x, this.y, x, y);
          if (distance <= this.radius) {
            let tf = sketch.timeFactorMap[[x, y]];
            sketch.rippleOffsets[[x, y]] =
              (sketch.rippleOffsets[[x, y]] || 0) +
              sketch.map(
                sketch.abs(distance - this.rippleDist),
                0,
                this.rippleWidth,
                -this.strength,
                0,
                true
              ) *
                tf;
          }
        }
      }
    }

    // Method to check if the ripple has dissipated
    isDissipated() {
      return this.rippleDist >= this.radius;
    }
  }

  sketch.activeRipples = []; // Array to store active ripple objects

  sketch.p3_tileClicked = (i, j) => {
    // Create a new ripple at the clicked tile with initial strength and duration
    sketch.activeRipples.push(new Ripple(i, j));
  };

  sketch.timeOnScreen = {};
  sketch.timeFactorMap = {};
  sketch.noiseOffset = {};
  sketch.yOffsetMap = {};
  sketch.rippleOffsets = {};

  sketch.calculateYOffset = (i, j) => {
    sketch.noiseOffset[[i, j]] =
      (sketch.noiseOffset[[i, j]] || 0) +
      sketch.deltaTime * sketch.timeFactorMap[[i, j]];
    return sketch.map(
      sketch.noise(i * 0.05, j * 0.1 - sketch.noiseOffset[[i, j]] * 0.001),
      0,
      1,
      -50,
      50
    );
  };

  sketch.p3_drawBefore = () => {
    sketch.background(
      sketch.lerpColor(
        sketch.color(13, 110, 163),
        sketch.color(172, 96, 37),
        0.5
      )
    ); // Halfway between low colors
  };

  class Ship {
    constructor(x, y, s) {
      this.x = x;
      this.y = y;
      this.scale = s;
      this.origin = { x: x, y: y };
      this.target = { x: x, y: y };
      this.yOffset = 0;
      this.facingLeft = true;
      this.stranded = false;
    }

    // Method to update the ship's position and yOffset
    update() {
      let distance = sketch.dist(this.x, this.y, this.target.x, this.target.y);
      if (distance <= 0.02) {
        this.x = this.target.x;
        this.y = this.target.y;
        let { x, y } = this.getRandomAdjacentTile();
        this.origin = { x: this.x, y: this.y };
        this.target = { x, y };
        this.yOffset = sketch.yOffsetMap[[this.x, this.y]] || 0;
      } else {
        let targetYOffset =
          sketch.yOffsetMap[[this.target.x, this.target.y]] || 0;
        let originYOffset =
          sketch.yOffsetMap[[this.origin.x, this.origin.y]] || 0;
        this.yOffset = sketch.lerp(targetYOffset, originYOffset, distance);

        let tf = sketch.timeFactorMap[[this.origin.x, this.origin.y]];

        if (tf == 0) {
          this.stranded = true;
        }

        let dx = (this.target.x - this.origin.x) * 0.02 * tf;
        let dy = (this.target.y - this.origin.y) * 0.02 * tf;
        this.x += dx;
        this.y += dy;

        if (dx > 0 || dy < 0) {
          this.facingLeft = true;
        } else if (dx < 0 || dy > 0) {
          this.facingLeft = false;
        }
      }
    }

    getRandomAdjacentTile() {
      // Define all possible adjacent directions
      const directions = [
        { dx: 1, dy: 0 }, // Right
        { dx: -1, dy: 0 }, // Left
        { dx: 0, dy: 1 }, // Down
        { dx: 0, dy: -1 }, // Up
      ];

      // Shuffle the directions array to randomize the choice of adjacent tile
      sketch.shuffleArray(directions);

      // Check each direction for a valid adjacent tile
      for (let dir of directions) {
        let newX = this.x + dir.dx;
        let newY = this.y + dir.dy;

        // Check if the new position is different from the previous position and is not the previous origin
        if (
          this.origin &&
          !(newX === this.origin.x && newY === this.origin.y)
        ) {
          return { x: newX, y: newY };
        }
      }

      // If no valid adjacent tile is found, return the current position
      return { x: this.x, y: this.y };
    }

    // Method to draw the ship
    draw() {
      let [screen_x, screen_y] = sketch.worldToScreen(
        [this.x, this.y],
        [sketch.camera_offset.x, sketch.camera_offset.y]
      );
      sketch.push();
      sketch.translate(-screen_x, screen_y + this.yOffset);
      sketch.scale(this.scale);

      let angle = sketch.map(
        sketch.yOffsetMap[[this.target.x, this.target.y]] -
          sketch.yOffsetMap[[this.origin.x, this.origin.y]],
        -50,
        50,
        sketch.HALF_PI,
        -sketch.HALF_PI
      );

      sketch.translate(-20, -5);
      if (!this.facingLeft) {
        sketch.scale(-1, 1);
        sketch.rotate(angle);
      } else {
        sketch.rotate(-angle);
      }

      // Set fill color for hull, bow, and stern
      sketch.fill(139, 69, 19); // Brown
      sketch.noStroke();

      sketch.rect(-20, 0, 40, 10); // Hull
      sketch.triangle(-20, 0, -40, 0, -20, 10); // Bow
      sketch.triangle(20, 0, 40, 0, 20, 10); // Stern

      sketch.fill(sketch.frontSailColor);
      sketch.triangle(-35, -5, 0, -30, 0, -5); // Front Sail

      sketch.fill(sketch.backSailColor);
      sketch.triangle(5, -5, 5, -25, 25, -5); // Back Sail

      sketch.pop();
    }
  }

  sketch.ships = []; // Array to store ships and their positions

  sketch.p3_drawTile = (i, j) => {
    if ((sketch.timeOnScreen[[i, j]] || 0) == 0 && sketch.random() < 0.01) {
      sketch.ships.push(new Ship(i, j, sketch.random()));
    }

    sketch.timeOnScreen[[i, j]] = (sketch.timeOnScreen[[i, j]] || 0) + 1;

    let timeFactor = sketch.map(
      sketch.timeOnScreen[[i, j]],
      0,
      1000,
      1,
      0,
      true
    );
    sketch.timeFactorMap[[i, j]] = timeFactor;

    let yOffset = sketch.calculateYOffset(i, j);
    let rippleOffset = sketch.rippleOffsets[[i, j]] || 0; // Get ripple offset for the current tile
    sketch.yOffsetMap[[i, j]] = yOffset + rippleOffset;

    let depthFactor = sketch.map(yOffset, -50, 50, 1, 0);
    let tileColor = sketch.calculateColor(depthFactor, timeFactor);

    sketch.noStroke();
    sketch.fill(
      sketch.lerpColor(
        tileColor,
        sketch.color(255),
        sketch.map(sketch.noise(i * 0.5, j * 0.5), 0, 1, 0, 0.25)
      )
    );
    sketch.push();
    sketch.translate(0, sketch.yOffsetMap[[i, j]]);

    if (sketch.noise(i * 0.1, j * 0.1) > 0.5) {
      sketch.scale(depthFactor + 0.5);
      sketch.beginShape();
      sketch.vertex(-sketch.tw, 0);
      sketch.vertex(0, sketch.th);
      sketch.vertex(sketch.tw, 0);
      sketch.vertex(0, -sketch.th);
      sketch.endShape(sketch.CLOSE);
    } else {
      sketch.scale(depthFactor + 1.5);
      sketch.ellipse(0, 0, sketch.tw, sketch.th);
    }

    sketch.pop();
  };

  sketch.calculateColor = (depthFactor, timeFactor) => {
    let oceanHigh = sketch.color(9, 144, 118);
    let oceanLow = sketch.color(13, 110, 163);
    let desertHigh = sketch.color(234, 152, 47);
    let desertLow = sketch.color(172, 96, 37);

    let oceanColor = sketch.lerpColor(oceanLow, oceanHigh, depthFactor);
    let desertColor = sketch.lerpColor(desertLow, desertHigh, depthFactor);

    return sketch.lerpColor(desertColor, oceanColor, timeFactor);
  };

  sketch.p3_drawSelectedTile = (i, j) => {
    let yOffset = sketch.yOffsetMap[[i, j]] || 0;
    sketch.noFill();
    sketch.stroke(0, 255, 0, 128);

    let depthFactor = sketch.map(yOffset, -50, 50, 0, 1);

    sketch.push();
    sketch.translate(0, yOffset);

    if (sketch.noise(i * 0.1, j * 0.1) > 0.5) {
      sketch.scale(1 - depthFactor + 0.5);
      sketch.beginShape();
      sketch.vertex(-sketch.tw, 0);
      sketch.vertex(0, sketch.th);
      sketch.vertex(sketch.tw, 0);
      sketch.vertex(0, -sketch.th);
      sketch.endShape(sketch.CLOSE);
    } else {
      sketch.scale(1 - depthFactor + 1.5);
      sketch.ellipse(0, 0, sketch.tw, sketch.th);
    }

    sketch.pop();
  };

  sketch.p3_drawAfter = () => {
    sketch.deltaTime = sketch.millis() - sketch.lastFrameTime;
    sketch.lastFrameTime = sketch.millis();

    // Reset ripple offsets
    sketch.rippleOffsets = {};

    for (let i = sketch.activeRipples.length - 1; i >= 0; i--) {
      let ripple = sketch.activeRipples[i];
      if (ripple.isDissipated()) {
        // Remove the ripple if it has dissipated
        sketch.activeRipples.splice(i, 1);
      }
      ripple.update();
    }

    // Draw ships
    for (let i = 0; i < sketch.ships.length; i++) {
      let ship = sketch.ships[i];
      if (!ship.stranded) {
        ship.update();
      }
      ship.draw();
    }
  };

  // Function to shuffle an array in place
  sketch.shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };
};

let world1 = new p5(w1);

const w2 = (sketch) => {
  sketch.tile_width_step_main; // A width step is half a tile's width
  sketch.tile_height_step_main; // A height step is half a tile's height

  // Global variables. These will mostly be overwritten in setup().
  sketch.tile_rows, sketch.tile_columns;
  sketch.camera_offset;
  sketch.camera_velocity;

  /////////////////////////////
  // Transforms between coordinate systems
  // These are actually slightly weirder than in full 3d...
  /////////////////////////////
  sketch.worldToScreen = ([world_x, world_y], [camera_x, camera_y]) => {
    let i = (world_x - world_y) * sketch.tile_width_step_main;
    let j = (world_x + world_y) * sketch.tile_height_step_main;
    return [i + camera_x, j + camera_y];
  };

  sketch.worldToCamera = ([world_x, world_y], [camera_x, camera_y]) => {
    let i = (world_x - world_y) * sketch.tile_width_step_main;
    let j = (world_x + world_y) * sketch.tile_height_step_main;
    return [i, j];
  };

  sketch.tileRenderingOrder = (offset) => {
    return [offset[1] - offset[0], offset[0] + offset[1]];
  };

  sketch.screenToWorld = ([screen_x, screen_y], [camera_x, camera_y]) => {
    screen_x -= camera_x;
    screen_y -= camera_y;
    screen_x /= sketch.tile_width_step_main * 2;
    screen_y /= sketch.tile_height_step_main * 2;
    screen_y += 0.5;
    return [Math.floor(screen_y + screen_x), Math.floor(screen_y - screen_x)];
  };

  sketch.cameraToWorldOffset = ([camera_x, camera_y]) => {
    let world_x = camera_x / (sketch.tile_width_step_main * 2);
    let world_y = camera_y / (sketch.tile_height_step_main * 2);
    return { x: Math.round(world_x), y: Math.round(world_y) };
  };

  sketch.worldOffsetToCamera = ([world_x, world_y]) => {
    let camera_x = world_x * (sketch.tile_width_step_main * 2);
    let camera_y = world_y * (sketch.tile_height_step_main * 2);
    return new p5.Vector(camera_x, camera_y);
  };

  sketch.preload = () => {
    if (sketch.p3_preload) {
      sketch.p3_preload();
    }
  };

  sketch.setup = () => {
    let canvas = sketch.createCanvas(800, 400);
    canvas.parent("canvasContainer2");

    sketch.camera_offset = new p5.Vector(-sketch.width / 2, sketch.height / 2);
    sketch.camera_velocity = new p5.Vector(0, 0);

    if (sketch.p3_setup) {
      sketch.p3_setup();
    }
    
    sketch.rebuildWorld("xyzzy");
  };

  sketch.rebuildWorld = (key) => {
    if (sketch.p3_worldKeyChanged) {
      sketch.p3_worldKeyChanged(key);
    }
    sketch.tile_width_step_main = sketch.p3_tileWidth
      ? sketch.p3_tileWidth()
      : 32;
    sketch.tile_height_step_main = sketch.p3_tileHeight
      ? sketch.p3_tileHeight()
      : 14.5;
    sketch.tile_columns = Math.ceil(
      sketch.width / (sketch.tile_width_step_main * 2)
    );
    sketch.tile_rows = Math.ceil(
      sketch.height / (sketch.tile_height_step_main * 2)
    );
  };

  sketch.mouseClicked = () => {
    let world_pos = sketch.screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [sketch.camera_offset.x, sketch.camera_offset.y]
    );

    if (sketch.p3_tileClicked) {
      sketch.p3_tileClicked(world_pos[0], world_pos[1]);
    }
    return false;
  };

  sketch.draw = () => {
    // Keyboard controls!
    if (sketch.keyIsDown(sketch.LEFT_ARROW)) {
      sketch.camera_velocity.x -= 1;
    }
    if (sketch.keyIsDown(sketch.RIGHT_ARROW)) {
      sketch.camera_velocity.x += 1;
    }
    if (sketch.keyIsDown(sketch.DOWN_ARROW)) {
      sketch.camera_velocity.y -= 1;
    }
    if (sketch.keyIsDown(sketch.UP_ARROW)) {
      sketch.camera_velocity.y += 1;
    }

    let camera_delta = new p5.Vector(0, 0);
    sketch.camera_velocity.add(camera_delta);
    sketch.camera_offset.add(sketch.camera_velocity);
    sketch.camera_velocity.mult(0.95); // cheap easing
    if (sketch.camera_velocity.mag() < 0.01) {
      sketch.camera_velocity.setMag(0);
    }

    let world_pos = sketch.screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [sketch.camera_offset.x, sketch.camera_offset.y]
    );
    let world_offset = sketch.cameraToWorldOffset([
      sketch.camera_offset.x,
      sketch.camera_offset.y,
    ]);

    sketch.background(100);

    if (sketch.p3_drawBefore) {
      sketch.p3_drawBefore();
    }

    let overdraw = 0.1;

    let y0 = Math.floor((0 - overdraw) * sketch.tile_rows);
    let y1 = Math.floor((1 + overdraw) * sketch.tile_rows);
    let x0 = Math.floor((0 - overdraw) * sketch.tile_columns);
    let x1 = Math.floor((1 + overdraw) * sketch.tile_columns);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        sketch.drawTile(
          sketch.tileRenderingOrder([x + world_offset.x, y - world_offset.y]),
          [sketch.camera_offset.x, sketch.camera_offset.y]
        ); // odd row
      }
      for (let x = x0; x < x1; x++) {
        sketch.drawTile(
          sketch.tileRenderingOrder([
            x + 0.5 + world_offset.x,
            y + 0.5 - world_offset.y,
          ]),
          [sketch.camera_offset.x, sketch.camera_offset.y]
        ); // even rows are offset horizontally
      }
    }

    sketch.describeMouseTile(world_pos, [
      sketch.camera_offset.x,
      sketch.camera_offset.y,
    ]);

    if (sketch.p3_drawAfter) {
      sketch.p3_drawAfter();
    }
  };

  // Display a discription of the tile at world_x, world_y.
  sketch.describeMouseTile = ([world_x, world_y], [camera_x, camera_y]) => {
    let [screen_x, screen_y] = sketch.worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    sketch.drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
  };

  sketch.drawTileDescription = ([world_x, world_y], [screen_x, screen_y]) => {
    sketch.push();
    sketch.translate(screen_x, screen_y);
    if (sketch.p3_drawSelectedTile) {
      sketch.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
    }
    sketch.pop();
  };

  // Draw a tile, mostly by calling the user's drawing code.
  sketch.drawTile = ([world_x, world_y], [camera_x, camera_y]) => {
    let [screen_x, screen_y] = sketch.worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    sketch.push();
    sketch.translate(0 - screen_x, screen_y);
    if (sketch.p3_drawTile) {
      sketch.p3_drawTile(world_x, world_y, -screen_x, screen_y);
    }
    sketch.pop();
  };

  sketch.p3_preload = () => {};

  sketch.p3_setup = () => {};

  sketch.worldSeed;

  sketch.p3_worldKeyChanged = (key) => {
    sketch.worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(sketch.worldSeed);
    sketch.randomSeed(sketch.worldSeed);
    sketch.flowers = {};
  };

  sketch.p3_tileWidth = () => {
    return 24;
  };

  sketch.p3_tileHeight = () => {
    return 12;
  };

  [sketch.tw, sketch.th] = [sketch.p3_tileWidth(), sketch.p3_tileHeight()];

  class Ripple {
    constructor(i, j) {
      this.i = i;
      this.j = j;
      this.radius = 10;
      this.rippleDist = 0;
      this.initialStrength = 50;
      this.strength = 50;
      this.rippleWidth = 3;
      this.rippleSpeed = 0.01;
    }

    // Method to update the ripple's strength and age
    update() {
      this.rippleDist += this.radius * this.rippleSpeed;
      this.strength =
        this.initialStrength * ((this.radius - this.rippleDist) / this.radius);

      // Update rippleOffsets based on the influence of active ripples
      for (let i = this.i - this.radius; i <= this.i + this.radius; i++) {
        for (let j = this.j - this.radius; j <= this.j + this.radius; j++) {
          let distance = sketch.dist(this.i, this.j, i, j);
          if (distance <= this.radius) {
            sketch.rippleOffsets[[i, j]] =
              (sketch.rippleOffsets[[i, j]] || 0) +
              sketch.map(
                sketch.abs(distance - this.rippleDist),
                0,
                this.rippleWidth,
                -this.strength,
                0,
                true
              );
          }
        }
      }
    }

    irrigate() {
      for (let i = this.i - this.radius; i <= this.i + this.radius; i++) {
        for (let j = this.j - this.radius; j <= this.j + this.radius; j++) {
          if (sketch.flowers[[i, j]] || 0) {
            let distance = sketch.dist(this.i, this.j, i, j);
            if (
              distance <= this.radius &&
              sketch.abs(distance - this.rippleDist) < this.rippleWidth
            ) {
              sketch.flowers[[i, j]].irrigated = true;
            }
          }
        }
      }
    }

    // Method to check if the ripple has dissipated
    isDissipated() {
      return this.rippleDist >= this.radius;
    }
  }

  sketch.activeRipples = []; // Array to store active ripple objects

  sketch.p3_tileClicked = (i, j) => {
    // Create a new ripple at the clicked tile with initial strength and duration
    sketch.activeRipples.push(new Ripple(i, j));
  };

  sketch.terrainOffsets = {};
  sketch.flowers = {};
  sketch.rippleOffsets = {};

  sketch.p3_drawBefore = () => {
    sketch.background(66, 87, 29); // Halfway between low colors
  };

  class Flower {
    constructor(i, j) {
      this.maxHeight = sketch.random(1, 10);
      this.currentHeight = 0;
      this.irrigated = false;
      this.x = sketch.random(-sketch.tw / 6, sketch.tw / 6);
      this.y = sketch.random(-sketch.tw / 6, sketch.tw / 6);
      this.stemColor = sketch.lerpColor(
        sketch.color(36, 73, 14),
        sketch.color(132, 149, 14),
        sketch.random()
      );
      this.stemWidth = sketch.random(1, 2);
      let r = sketch.map(
        sketch.noise(i * 0.03, j * 0.03),
        0.3,
        0.7,
        0,
        255,
        true
      );
      let g = sketch.map(
        sketch.noise(i * 0.03 + 7, j * 0.03 + 7),
        0.3,
        0.7,
        0,
        255,
        true
      );
      let b = sketch.map(
        sketch.noise(i * 0.03 + 13, j * 0.03 + 13),
        0.3,
        0.7,
        0,
        255,
        true
      );
      this.petalColor = sketch.color(r, g, b);
      this.centerColor = sketch.color(249, 240, 64);
      this.fullyGrown = false;
      this.flowerScale = sketch.random(0.5, 1.5);
    }

    grow() {
      if (this.currentHeight < this.maxHeight) {
        this.currentHeight += 0.01; // Increment current height if conditions are met
      } else {
        this.fullyGrown = true;
      }
    }

    draw() {
      // Draw Seed
      sketch.fill(203, 184, 158);

      sketch.scale(this.flowerScale);

      sketch.beginShape();
      sketch.vertex(this.x - sketch.tw / 8, this.y);
      sketch.vertex(this.x, this.y + sketch.th / 8);
      sketch.vertex(this.x + sketch.tw / 8, this.y);
      sketch.vertex(this.x, this.y + -sketch.th / 8);
      sketch.endShape(sketch.CLOSE);

      // Draw stem
      sketch.stroke(this.stemColor);
      sketch.strokeWeight(this.stemWidth);
      if (this.currentHeight > 0) {
        sketch.line(this.x, this.y, this.x, this.y - this.currentHeight);
      }

      // Check if flower has reached max height
      if (this.currentHeight >= this.maxHeight) {
        // Draw flower at the top of the stem
        sketch.noStroke();
        sketch.fill(this.petalColor);
        sketch.ellipse(this.x, this.y + -this.maxHeight, 10, 10);
        sketch.fill(this.centerColor); // Yellow center
        sketch.ellipse(this.x, this.y + -this.maxHeight, 5, 5);
      }
    }
  }

  sketch.p3_drawTile = (i, j) => {
    if (!(sketch.terrainOffsets[[i, j]] || 0)) {
      sketch.terrainOffsets[[i, j]] = sketch.map(
        sketch.noise(i * 0.05, j * 0.05),
        0,
        1,
        -50,
        150
      );
    }
    let terrainOffset = sketch.terrainOffsets[[i, j]];
    let rippleOffset = sketch.rippleOffsets[[i, j]] || 0; // Get ripple offset for the current tile
    let yOffset = terrainOffset + rippleOffset;

    let depthFactor = sketch.map(terrainOffset, -50, 150, 1, 0);
    let tileColor = sketch.calculateColor(depthFactor);

    if (depthFactor > 0.5) {
      sketch.push();
      sketch.noStroke();
      sketch.fill(
        sketch.lerpColor(
          tileColor,
          sketch.color(255),
          sketch.map(sketch.noise(i * 0.5, j * 0.5), 0, 1, 0, 0.25)
        )
      );
      sketch.translate(0, yOffset);
      sketch.scale(depthFactor + 1.7);
      sketch.ellipse(0, 0, sketch.tw, sketch.th); // Draw tile
      if (sketch.noise(i * 0.04, j * 0.04) < 0.5) {
        if (!(sketch.flowers[[i, j]] || 0)) {
          sketch.flowers[[i, j]] = new Flower(i, j);
        }
        sketch.flowers[[i, j]].draw();
      }
      sketch.pop();
    }
  };

  sketch.calculateColor = (depthFactor) => {
    let grassHigh = sketch.color(148, 159, 70);
    let grassLow = sketch.color(87, 110, 22);

    return sketch.lerpColor(grassLow, grassHigh, depthFactor);
  };

  sketch.p3_drawSelectedTile = (i, j) => {
    let terrainOffset = sketch.terrainOffsets[[i, j]];
    let rippleOffset = sketch.rippleOffsets[[i, j]] || 0;

    let yOffset = terrainOffset + rippleOffset;
    let depthFactor = sketch.map(terrainOffset, -50, 150, 1, 0);

    sketch.push();
    sketch.noFill();
    sketch.stroke(0, 255, 0, 128);
    sketch.translate(0, yOffset);
    sketch.scale(depthFactor + 1.5);
    sketch.ellipse(0, 0, sketch.tw, sketch.th);
    sketch.pop();
  };

  sketch.p3_drawAfter = () => {
    // Reset ripple offsets
    sketch.rippleOffsets = {};

    for (let i = sketch.activeRipples.length - 1; i >= 0; i--) {
      let ripple = sketch.activeRipples[i];
      if (ripple.isDissipated()) {
        // Remove the ripple if it has dissipated
        sketch.activeRipples.splice(i, 1);
      }
      ripple.update();
      ripple.irrigate();
    }

    for (let flowerCoords in sketch.flowers) {
      if (
        sketch.flowers[flowerCoords].irrigated &&
        !sketch.flowers[flowerCoords].fullyGrown
      ) {
        sketch.flowers[flowerCoords].grow();
      }
    }
  };
};

let world2 = new p5(w2);

const w3 = (sketch) => {
  sketch.tile_width_step_main; // A width step is half a tile's width
  sketch.tile_height_step_main; // A height step is half a tile's height

  // Global variables. These will mostly be overwritten in setup().
  sketch.tile_rows, sketch.tile_columns;
  sketch.camera_offset;
  sketch.camera_velocity;

  /////////////////////////////
  // Transforms between coordinate systems
  // These are actually slightly weirder than in full 3d...
  /////////////////////////////
  sketch.worldToScreen = ([world_x, world_y], [camera_x, camera_y]) => {
    let i = (world_x - world_y) * sketch.tile_width_step_main;
    let j = (world_x + world_y) * sketch.tile_height_step_main;
    return [i + camera_x, j + camera_y];
  };

  sketch.worldToCamera = ([world_x, world_y], [camera_x, camera_y]) => {
    let i = (world_x - world_y) * sketch.tile_width_step_main;
    let j = (world_x + world_y) * sketch.tile_height_step_main;
    return [i, j];
  };

  sketch.tileRenderingOrder = (offset) => {
    return [offset[1] - offset[0], offset[0] + offset[1]];
  };

  sketch.screenToWorld = ([screen_x, screen_y], [camera_x, camera_y]) => {
    screen_x -= camera_x;
    screen_y -= camera_y;
    screen_x /= sketch.tile_width_step_main * 2;
    screen_y /= sketch.tile_height_step_main * 2;
    screen_y += 0.5;
    return [Math.floor(screen_y + screen_x), Math.floor(screen_y - screen_x)];
  };

  sketch.cameraToWorldOffset = ([camera_x, camera_y]) => {
    let world_x = camera_x / (sketch.tile_width_step_main * 2);
    let world_y = camera_y / (sketch.tile_height_step_main * 2);
    return { x: Math.round(world_x), y: Math.round(world_y) };
  };

  sketch.worldOffsetToCamera = ([world_x, world_y]) => {
    let camera_x = world_x * (sketch.tile_width_step_main * 2);
    let camera_y = world_y * (sketch.tile_height_step_main * 2);
    return new p5.Vector(camera_x, camera_y);
  };

  sketch.preload = () => {
    if (sketch.p3_preload) {
      sketch.p3_preload();
    }
  };

  sketch.setup = () => {
    let canvas = sketch.createCanvas(800, 400);
    canvas.parent("canvasContainer3");

    sketch.camera_offset = new p5.Vector(-sketch.width / 2, sketch.height / 2);
    sketch.camera_velocity = new p5.Vector(0, 0);

    if (sketch.p3_setup) {
      sketch.p3_setup();
    }

    let label = sketch.createP();
    label.html("World key: ");
    label.parent("canvasContainer3");

    let input = sketch.createInput("xyzzy");
    input.parent(label);
    input.input(() => {
      sketch.rebuildWorld(input.value());
    });

    sketch
      .createP("Arrow keys scroll. Clicking changes tiles.")
      .parent("canvasContainer3");

    sketch.rebuildWorld(input.value());
  };

  sketch.rebuildWorld = (key) => {
    if (sketch.p3_worldKeyChanged) {
      sketch.p3_worldKeyChanged(key);
    }
    sketch.tile_width_step_main = sketch.p3_tileWidth
      ? sketch.p3_tileWidth()
      : 32;
    sketch.tile_height_step_main = sketch.p3_tileHeight
      ? sketch.p3_tileHeight()
      : 14.5;
    sketch.tile_columns = Math.ceil(
      sketch.width / (sketch.tile_width_step_main * 2)
    );
    sketch.tile_rows = Math.ceil(
      sketch.height / (sketch.tile_height_step_main * 2)
    );
  };

  sketch.mouseClicked = () => {
    let world_pos = sketch.screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [sketch.camera_offset.x, sketch.camera_offset.y]
    );

    if (sketch.p3_tileClicked) {
      sketch.p3_tileClicked(world_pos[0], world_pos[1]);
    }
    return false;
  };

  sketch.draw = () => {
    // Keyboard controls!
    if (sketch.keyIsDown(sketch.LEFT_ARROW)) {
      sketch.camera_velocity.x -= 1;
    }
    if (sketch.keyIsDown(sketch.RIGHT_ARROW)) {
      sketch.camera_velocity.x += 1;
    }
    if (sketch.keyIsDown(sketch.DOWN_ARROW)) {
      sketch.camera_velocity.y -= 1;
    }
    if (sketch.keyIsDown(sketch.UP_ARROW)) {
      sketch.camera_velocity.y += 1;
    }

    let camera_delta = new p5.Vector(0, 0);
    sketch.camera_velocity.add(camera_delta);
    sketch.camera_offset.add(sketch.camera_velocity);
    sketch.camera_velocity.mult(0.95); // cheap easing
    if (sketch.camera_velocity.mag() < 0.01) {
      sketch.camera_velocity.setMag(0);
    }

    let world_pos = sketch.screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [sketch.camera_offset.x, sketch.camera_offset.y]
    );
    let world_offset = sketch.cameraToWorldOffset([
      sketch.camera_offset.x,
      sketch.camera_offset.y,
    ]);

    sketch.background(100);

    if (sketch.p3_drawBefore) {
      sketch.p3_drawBefore();
    }

    let overdraw = 0.1;

    let y0 = Math.floor((0 - overdraw) * sketch.tile_rows);
    let y1 = Math.floor((1 + overdraw) * sketch.tile_rows);
    let x0 = Math.floor((0 - overdraw) * sketch.tile_columns);
    let x1 = Math.floor((1 + overdraw) * sketch.tile_columns);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        sketch.drawTile(
          sketch.tileRenderingOrder([x + world_offset.x, y - world_offset.y]),
          [sketch.camera_offset.x, sketch.camera_offset.y]
        ); // odd row
      }
      for (let x = x0; x < x1; x++) {
        sketch.drawTile(
          sketch.tileRenderingOrder([
            x + 0.5 + world_offset.x,
            y + 0.5 - world_offset.y,
          ]),
          [sketch.camera_offset.x, sketch.camera_offset.y]
        ); // even rows are offset horizontally
      }
    }

    sketch.describeMouseTile(world_pos, [
      sketch.camera_offset.x,
      sketch.camera_offset.y,
    ]);

    if (sketch.p3_drawAfter) {
      sketch.p3_drawAfter();
    }
  };

  // Display a discription of the tile at world_x, world_y.
  sketch.describeMouseTile = ([world_x, world_y], [camera_x, camera_y]) => {
    let [screen_x, screen_y] = sketch.worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    sketch.drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
  };

  sketch.drawTileDescription = ([world_x, world_y], [screen_x, screen_y]) => {
    sketch.push();
    sketch.translate(screen_x, screen_y);
    if (sketch.p3_drawSelectedTile) {
      sketch.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
    }
    sketch.pop();
  };

  // Draw a tile, mostly by calling the user's drawing code.
  sketch.drawTile = ([world_x, world_y], [camera_x, camera_y]) => {
    let [screen_x, screen_y] = sketch.worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    sketch.push();
    sketch.translate(0 - screen_x, screen_y);
    if (sketch.p3_drawTile) {
      sketch.p3_drawTile(world_x, world_y, -screen_x, screen_y);
    }
    sketch.pop();
  };

  sketch.p3_preload = () => {};

  sketch.p3_setup = () => {};

  sketch.worldSeed;

  sketch.p3_worldKeyChanged = (key) => {
    sketch.worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(sketch.worldSeed);
    sketch.randomSeed(sketch.worldSeed);
    sketch.volcanoOffsets = {};
    sketch.lavas = {};
  };

  sketch.p3_tileWidth = () => {
    return 24;
  };

  sketch.p3_tileHeight = () => {
    return 16;
  };

  [sketch.tw, sketch.th] = [sketch.p3_tileWidth(), sketch.p3_tileHeight()];

  sketch.oceanOffsets = {};
  sketch.volcanoOffsets = {};
  sketch.volcanoSelectors = {};
  sketch.lavas = {};

  const FRONTIER = 1;
  const DONE = 2;
  sketch.p3_tileClicked = (i, j) => {
    sketch.lavas[[i, j]] = FRONTIER;
  };

  sketch.p3_drawBefore = () => {
    sketch.background(13, 110, 163);
  };

  sketch.calculateWaterColor = (i, j) => {
    let waterHigh = sketch.color(9, 144, 118);
    let waterLow = sketch.color(13, 110, 163);
    let depthFactor =sketch.map(sketch.oceanOffsets[[i, j]], -50, 50, 1, 0);
    let waterColor = sketch.lerpColor(waterLow, waterHigh, depthFactor);

    return waterColor;
  };

  sketch.p3_drawTile = (i, j) => {
    let maxHeight = 200;
    let yOffset;
    let tileColor;
    if (!(sketch.volcanoSelectors[[i, j]] || 0)) {
      let v = sketch.map(sketch.noise(i * 0.05, j * 0.05), 0, 1, 0, 5);
      sketch.volcanoSelectors[[i, j]] = v;
    }
    if (sketch.volcanoSelectors[[i, j]] > 3) {
      if (!(sketch.volcanoOffsets[[i, j]] || 0)) {
        sketch.volcanoOffsets[[i, j]] = -sketch.map(
          sketch.noise(i * 0.1, j * 0.1),
          0,
          1,
          0,
          sketch.constrain(sketch.volcanoSelectors[[i, j]] - 3, 0, 1) * maxHeight
        );
      }
      yOffset = sketch.volcanoOffsets[[i, j]];
      if (yOffset < -95 && !(sketch.lavas[[i, j]] || 0)) {
        sketch.lavas[[i, j]] = FRONTIER;
      }
      if (sketch.lavas[[i, j]] || 0) {
        tileColor = sketch.color(249, 124, 19); // Orange
      } else {
        tileColor = sketch.color(126, 86, 78); // Brown
      }
    } else {
      sketch.oceanOffsets[[i, j]] = sketch.map(
        sketch.noise(i * 0.05, j * 0.1 - sketch.millis() * 0.0005),
        0,
        1,
        -50,
        50
      );
      yOffset = sketch.oceanOffsets[[i, j]];
      tileColor = sketch.calculateWaterColor(i, j);
    }

    let depthFactor = sketch.map(yOffset, -50, 50, 1, 0);

    sketch.noStroke();
    sketch.fill(
      sketch.lerpColor(
        tileColor,
        sketch.color(255),
        sketch.map(sketch.noise(i * 0.5, j * 0.5), 0, 1, 0, 0.25)
      )
    );
    sketch.push();
    sketch.translate(0, yOffset);

    sketch.scale(depthFactor + 0.5);
    sketch.beginShape();
    sketch.vertex(-sketch.tw, 0);
    sketch.vertex(0, sketch.th);
    sketch.vertex(sketch.tw, 0);
    sketch.vertex(0, -sketch.th);
    sketch.endShape(sketch.CLOSE); // Draw tile

    sketch.pop();
  };

  sketch.p3_drawSelectedTile = (i, j) => {
    let maxHeight = 200;
    let yOffset;
    if (sketch.volcanoSelectors[[i, j]] > 3) {
      if (!(sketch.volcanoOffsets[[i, j]] || 0)) {
        sketch.volcanoOffsets[[i, j]] = -sketch.map(
          sketch.noise(i * 0.1, j * 0.1),
          0,
          1,
          0,
          sketch.constrain(sketch.volcanoSelectors[[i, j]] - 3, 0, 1) * maxHeight
        );
      }
      yOffset = sketch.volcanoOffsets[[i, j]];
    } else {
      sketch.oceanOffsets[[i, j]] = sketch.map(
        sketch.noise(i * 0.05, j * 0.1 - sketch.millis() * 0.0005),
        0,
        1,
        -50,
        50
      );
      yOffset = sketch.oceanOffsets[[i, j]];
    }

    let depthFactor = sketch.map(yOffset, -50, 50, 1, 0);

    sketch.push();
    sketch.noFill();
    sketch.stroke(0, 255, 0, 128);
    sketch.translate(0, yOffset);
    sketch.scale(depthFactor + 0.5);
    sketch.beginShape();
    sketch.vertex(-sketch.tw, 0);
    sketch.vertex(0, sketch.th);
    sketch.vertex(sketch.tw, 0);
    sketch.vertex(0, -sketch.th);
    sketch.endShape(sketch.CLOSE); // Draw tile
    sketch.pop();
  };

  sketch.counter = 0;
  sketch.p3_drawAfter = () => {
    sketch.counter++;
    if (sketch.counter >= 50) {
      sketch.counter = 0;
      for (let coordString in sketch.lavas) {
        if (sketch.lavas[coordString] == FRONTIER) {
          const coords = coordString.split(",");
          sketch.flow(parseInt(coords[0]), parseInt(coords[1]));
        }
      }
    }
  };

  sketch.flow = (i, j) => {
    // Define all possible adjacent directions
    const directions = [
      { di: 1, dj: 0 },
      { di: -1, dj: 0 },
      { di: 0, dj: 1 },
      { di: 0, dj: -1 },
    ];

    // Shuffle the directions array to randomize the choice of adjacent tile
    sketch.shuffleArray(directions);

    // Check each direction for a valid adjacent tile
    for (let dir of directions) {
      let newI = i + dir.di;
      let newJ = j + dir.dj;

      if (
        (sketch.volcanoOffsets[[newI, newJ]] || 0) &&
        sketch.volcanoOffsets[[newI, newJ]] > sketch.volcanoOffsets[[i, j]]
      ) {
        sketch.lavas[[newI, newJ]] = FRONTIER;
        break;
      }
    }
    sketch.lavas[[i, j]] = DONE;
  };

  // Function to shuffle an array in place
  sketch.shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };
};

let world3 = new p5(w3);
