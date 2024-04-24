// sketch.js - Alternate Worlds
// Author: Joost Vonk
// Date: 4/23/24

// Thanks to Alex Leghart for the help integrating these sketches into one
const w1 = (sketch) => {
  sketch.seed = 0;
  sketch.tilesetImage;
  sketch.currentGrid = [];
  sketch.numRows, sketch.numCols;

  sketch.preload = () => {
    sketch.tilesetImage = sketch.loadImage(
      "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2Ftileset.png?v=1611654020439"
    );
  };

  sketch.reseed = () => {
    sketch.seed = (sketch.seed | 0) + 1109;
    sketch.randomSeed(sketch.seed);
    sketch.noiseSeed(sketch.seed);
    sketch.select("#seedReportOverworld").html("seed " + sketch.seed);
    sketch.regenerateGrid();
  };

  sketch.regenerateGrid = () => {
    sketch
      .select("#asciiBoxOverworld")
      .value(
        sketch.gridToString(sketch.generateGrid(sketch.numCols, sketch.numRows))
      );
    sketch.reparseGrid();
  };

  sketch.reparseGrid = () => {
    sketch.currentGrid = sketch.stringToGrid(
      sketch.select("#asciiBoxOverworld").value()
    );
  };

  sketch.gridToString = (grid) => {
    let rows = [];
    for (let i = 0; i < grid.length; i++) {
      rows.push(grid[i].join(""));
    }
    return rows.join("\n");
  };

  sketch.stringToGrid = (str) => {
    let grid = [];
    let lines = str.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let row = [];
      let chars = lines[i].split("");
      for (let j = 0; j < chars.length; j++) {
        row.push(chars[j]);
      }
      grid.push(row);
    }
    return grid;
  };

  sketch.setup = () => {
    sketch.numRows = sketch.select("#asciiBoxOverworld").attribute("rows") | 0;
    sketch.numCols = sketch.select("#asciiBoxOverworld").attribute("cols") | 0;

    // place our canvas, making it fit our container
    sketch
      .createCanvas(16 * sketch.numRows, 16 * sketch.numCols)
      .parent("canvasContainerOverworld");
    sketch.select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

    sketch.select("#reseedButtonOverworld").mousePressed(sketch.reseed);
    sketch.select("#asciiBoxOverworld").input(sketch.reparseGrid);

    sketch.reseed();
  };

  sketch.draw = () => {
    sketch.randomSeed(sketch.seed);
    sketch.drawGrid(sketch.currentGrid);
  };

  sketch.placeTile = (i, j, ti, tj) => {
    sketch.image(
      sketch.tilesetImage,
      16 * i,
      16 * j,
      16,
      16,
      8 * ti,
      8 * tj,
      8,
      8
    );
  };

  /* exported generateGrid, drawGrid */
  /* global placeTile */

  sketch.generateGrid = (numRows, numCols) => {
    // background
    const grid = [];
    for (let i = 0; i < numRows; i++) {
      const row = [];
      for (let j = 0; j < numCols; j++) {
        let n = sketch.noise(i / 10, j / 10);
        if (n < 0.35) {
          row.push("~");
        } else if (n < 0.4) {
          row.push("=");
        } else if (n < 0.5) {
          row.push("_");
        } else {
          row.push(".");
        }
      }
      grid.push(row);
    }
    return grid;
  };

  sketch.gridCheck = (grid, i, j, targets) => {
    // bounds check
    if (i >= 0 && i < grid.length && j >= 0 && j < grid[i].length) {
      for (let target of targets) {
        if (grid[j][i] == target) {
          return true;
        }
      }
    }
    return false;
  };

  sketch.neighborsCode = (grid, i, j, targets) => {
    const northBit = sketch.gridCheck(grid, i, j - 1, targets);
    const southBit = sketch.gridCheck(grid, i, j + 1, targets);
    const eastBit = sketch.gridCheck(grid, i + 1, j, targets);
    const westBit = sketch.gridCheck(grid, i - 1, j, targets);
    const northEastBit = sketch.gridCheck(grid, i + 1, j - 1, targets);
    const northWestBit = sketch.gridCheck(grid, i - 1, j - 1, targets);
    const southEastBit = sketch.gridCheck(grid, i + 1, j + 1, targets);
    const southWestBit = sketch.gridCheck(grid, i - 1, j + 1, targets);

    return (
      (northBit << 0) +
      (southBit << 1) +
      (eastBit << 2) +
      (westBit << 3) +
      (northEastBit << 4) +
      (northWestBit << 5) +
      (southEastBit << 6) +
      (southWestBit << 7)
    );
  };

  sketch.drawContext = (grid, i, j, targets, ti, tj) => {
    const code = sketch.neighborsCode(grid, i, j, targets);
    // render outside corners
    for (let k = 0; k < 4; k++) {
      let [tiOffset, tjOffset] = sketch.lookup[code & (1 << (4 + k))][0]; // Mask for each diagonal
      sketch.placeTile(i, j, ti + tiOffset, tj + tjOffset);
    }

    // render inside corners/edges
    for (let [tiOffset, tjOffset] of sketch.lookup[code & 15]) {
      // Mask off all diagonals
      sketch.placeTile(i, j, ti + tiOffset, tj + tjOffset);
    }
  };

  sketch.lookup = new Array(255).fill([[1, 1]]);
  sketch.lookup[0] = [[1, 1]]; // No Neighbors
  sketch.lookup[1] = [[1, 0]]; // North
  sketch.lookup[2] = [[1, 2]]; // South
  sketch.lookup[3] = [
    [1, 0],
    [1, 2],
  ]; // North + South
  sketch.lookup[4] = [[2, 1]]; // East
  sketch.lookup[5] = [[2, 0]]; // North + East
  sketch.lookup[6] = [[2, 2]]; // South + East
  sketch.lookup[7] = [
    [2, 0],
    [1, 2],
  ]; // North + South + East
  sketch.lookup[8] = [[0, 1]]; // West
  sketch.lookup[9] = [[0, 0]]; // North + West
  sketch.lookup[10] = [[0, 2]]; // South + West
  sketch.lookup[11] = [
    [0, 0],
    [1, 2],
  ]; // North + South + West
  sketch.lookup[12] = [
    [2, 1],
    [0, 1],
  ]; // East + West
  sketch.lookup[13] = [
    [2, 0],
    [0, 0],
  ]; // North + East + West
  sketch.lookup[14] = [
    [2, 2],
    [0, 2],
  ]; // South + East + West
  sketch.lookup[15] = [
    [2, 0],
    [0, 0],
    [1, 2],
  ]; // North + South + East + West
  sketch.lookup[16] = [[3, 1]]; // Northeast
  sketch.lookup[32] = [[4, 1]]; // Northwest
  sketch.lookup[64] = [[3, 0]]; // Southeast
  sketch.lookup[128] = [[4, 0]]; // Southwest

  sketch.sandMacroTiles = [
    [
      [
        [1, 18],
        [3, 18],
        [0, 18],
      ],
      [
        [1, 20],
        [0, 18],
        [0, 18],
      ],
      [
        [0, 18],
        [0, 18],
        [0, 18],
      ],
    ],

    [
      [
        [0, 18],
        [1, 18],
        [3, 18],
      ],
      [
        [0, 18],
        [1, 20],
        [0, 18],
      ],
      [
        [0, 18],
        [0, 18],
        [0, 18],
      ],
    ],

    [
      [
        [0, 18],
        [0, 18],
        [0, 18],
      ],
      [
        [0, 18],
        [1, 18],
        [3, 18],
      ],
      [
        [0, 18],
        [1, 20],
        [0, 18],
      ],
    ],

    [
      [
        [0, 18],
        [0, 18],
        [0, 18],
      ],
      [
        [1, 18],
        [3, 18],
        [0, 18],
      ],
      [
        [1, 20],
        [0, 18],
        [0, 18],
      ],
    ],

    [
      [
        [1, 18],
        [3, 18],
        [0, 18],
      ],
      [
        [1, 20],
        [1, 18],
        [3, 18],
      ],
      [
        [0, 18],
        [1, 20],
        [0, 18],
      ],
    ],

    [
      [
        [0, 18],
        [1, 18],
        [3, 18],
      ],
      [
        [1, 18],
        [3, 19],
        [0, 18],
      ],
      [
        [1, 20],
        [0, 18],
        [0, 18],
      ],
    ],
  ];

  sketch.sandAltMacroTiles = [
    [
      [
        [9, 18],
        [11, 18],
        [0, 19],
      ],
      [
        [9, 20],
        [0, 19],
        [0, 19],
      ],
      [
        [0, 19],
        [0, 19],
        [0, 19],
      ],
    ],

    [
      [
        [0, 19],
        [9, 18],
        [11, 18],
      ],
      [
        [0, 19],
        [9, 20],
        [0, 19],
      ],
      [
        [0, 19],
        [0, 19],
        [0, 19],
      ],
    ],

    [
      [
        [0, 19],
        [0, 19],
        [0, 19],
      ],
      [
        [0, 19],
        [9, 18],
        [11, 18],
      ],
      [
        [0, 19],
        [9, 20],
        [0, 19],
      ],
    ],

    [
      [
        [0, 19],
        [0, 19],
        [0, 19],
      ],
      [
        [9, 18],
        [11, 18],
        [0, 19],
      ],
      [
        [9, 20],
        [0, 19],
        [0, 19],
      ],
    ],

    [
      [
        [9, 18],
        [11, 18],
        [0, 19],
      ],
      [
        [9, 20],
        [9, 18],
        [11, 18],
      ],
      [
        [0, 19],
        [9, 20],
        [0, 19],
      ],
    ],

    [
      [
        [0, 19],
        [9, 18],
        [11, 18],
      ],
      [
        [9, 18],
        [11, 19],
        [0, 19],
      ],
      [
        [9, 20],
        [0, 19],
        [0, 19],
      ],
    ],
  ];

  sketch.placeMacroTile = (grid, i, j, targets, alt) => {
    const macroTile = alt
      ? sketch.random(sketch.sandAltMacroTiles)
      : sketch.random(sketch.sandMacroTiles);
    for (let jOffset = 0; jOffset < 3; jOffset++) {
      for (let iOffset = 0; iOffset < 3; iOffset++) {
        if (sketch.gridCheck(grid, i + iOffset, j + jOffset, targets)) {
          const [tiOffset, tjOffset] = macroTile[jOffset][iOffset];
          sketch.placeTile(i + iOffset, j + jOffset, tiOffset, tjOffset);
        }
      }
    }
  };

  sketch.drawGrid = (grid) => {
    sketch.background(128);

    for (let j = 0; j < grid.length; j += 1) {
      for (let i = 0; i < grid[j].length; i += 1) {
        // Draw Sand and AltSand Macro Tiles
        if (i % 3 == 0 && j % 3 == 0) {
          sketch.placeMacroTile(grid, i, j, ["_"], true);
          sketch.placeMacroTile(grid, i, j, ["."], false);
        }
        // Let Sand and Grass grow over AltSand
        if (sketch.gridCheck(grid, i, j, ["_"])) {
          sketch.drawContext(grid, i, j, ["="], 4, 0);
          sketch.drawContext(grid, i, j, ["."], 4, 18);
        }
        // Grass
        if (sketch.gridCheck(grid, i, j, ["="])) {
          let tileX;
          if (sketch.random() > 0.2) {
            tileX = 0; // No Leaves
            sketch.random(); // keep same amount of random calls on each iteration
          } else {
            tileX = sketch.random([1, 2, 3]); // Random Leaf Tile
          }
          sketch.placeTile(i, j, tileX, 0);
          sketch.drawContext(grid, i, j, ["."], 4, 18);

          if (sketch.random() < 0.05) {
            sketch.placeTile(i, j, 14, 0); // Tree
          }

          if (sketch.random() < 0.02) {
            sketch.placeTile(i, j, 28, 1); // Tower Base
            if (j - 1 != -1) {
              // Tile above isn't offscreen
              sketch.placeTile(i, j - 1, 28, 0); // Tower Spire
            }
          }
        }
        // Water
        if (sketch.gridCheck(grid, i, j, ["~"])) {
          let tileX;
          if (
            sketch.noise(
              i + sketch.millis() / 10000,
              j + sketch.millis() / 1000
            ) > 0.16
          ) {
            tileX = 0; // No Bubbles
            sketch.random(); // keep same amount of random calls on each iteration
          } else {
            tileX = sketch.random([1, 2, 3]); // Random Bubble Tile
          }
          sketch.placeTile(i, j, tileX, 14);
          // Convert water to Canal next to Land
          sketch.drawContext(grid, i, j, ["=", "_", "."], 5, 21);
        }
      }
    }
  };
};

let world1 = new p5(w1);

const w2 = (sketch) => {
  sketch.seed = 0;
  sketch.tilesetImage;
  sketch.currentGrid = [];
  sketch.numRows, sketch.numCols;

  sketch.preload = () => {
    sketch.tilesetImage = sketch.loadImage(
      "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2Ftileset.png?v=1611654020439"
    );
  };

  sketch.reseed = () => {
    sketch.seed = (sketch.seed | 0) + 1109;
    sketch.randomSeed(sketch.seed);
    sketch.noiseSeed(sketch.seed);
    sketch.select("#seedReportDungeon").html("seed " + sketch.seed);
    sketch.regenerateGrid();
  };

  sketch.regenerateGrid = () => {
    sketch
      .select("#asciiBoxDungeon")
      .value(
        sketch.gridToString(sketch.generateGrid(sketch.numCols, sketch.numRows))
      );
    sketch.reparseGrid();
  };

  sketch.reparseGrid = () => {
    sketch.currentGrid = sketch.stringToGrid(
      sketch.select("#asciiBoxDungeon").value()
    );
  };

  sketch.gridToString = (grid) => {
    let rows = [];
    for (let i = 0; i < grid.length; i++) {
      rows.push(grid[i].join(""));
    }
    return rows.join("\n");
  };

  sketch.stringToGrid = (str) => {
    let grid = [];
    let lines = str.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let row = [];
      let chars = lines[i].split("");
      for (let j = 0; j < chars.length; j++) {
        row.push(chars[j]);
      }
      grid.push(row);
    }
    return grid;
  };

  sketch.setup = () => {
    sketch.numRows = sketch.select("#asciiBoxDungeon").attribute("rows") | 0;
    sketch.numCols = sketch.select("#asciiBoxDungeon").attribute("cols") | 0;

    // place our canvas, making it fit our container
    sketch
      .createCanvas(16 * sketch.numRows, 16 * sketch.numCols)
      .parent("canvasContainerDungeon");
    sketch.select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

    sketch.select("#reseedButtonDungeon").mousePressed(sketch.reseed);
    sketch.select("#asciiBoxDungeon").input(sketch.reparseGrid);

    sketch.reseed();
  };

  sketch.draw = () => {
    sketch.randomSeed(sketch.seed);
    sketch.drawGrid(sketch.currentGrid);
  };

  sketch.placeTile = (i, j, ti, tj) => {
    sketch.image(
      sketch.tilesetImage,
      16 * i,
      16 * j,
      16,
      16,
      8 * ti,
      8 * tj,
      8,
      8
    );
  };

  /* exported generateGrid, drawGrid */
  /* global placeTile */

  sketch.generateGrid = (numRows, numCols) => {
    return sketch.generateDungeon(5, numRows, numCols);
  };

  sketch.generateDungeon = (numRooms, numRows, numCols) => {
    const dungeon = sketch.createEmptyDungeon(numRows, numCols); // Initialize dungeon with walls
    const rooms = sketch.generateRooms(numRooms, numRows, numCols); // Randomly place rooms

    // Fill the rooms with room tiles
    for (const room of rooms) {
      for (let j = room.y; j < room.y + room.height; j++) {
        for (let i = room.x; i < room.x + room.width; i++) {
          dungeon[j][i] = "."; // Use "." to represent room tiles
        }
      }
    }

    for (let i = numCols / 2 - 3; i < numCols / 2 + 3; i++) {
      dungeon[numRows - 1][i] = "~";
    }

    for (let i = numCols / 2 - 2; i < numCols / 2 + 2; i++) {
      dungeon[numRows - 2][i] = "~";
    }

    dungeon[numRows - 1][numCols / 2 - 4] = ".";
    dungeon[numRows - 1][numCols / 2 + 3] = ".";

    // Choose a random room as the starting point
    const startRoom = sketch.random(rooms);

    // Initialize a list of corridors
    const corridors = [];

    // Initialize a set of visited rooms
    const visitedRooms = new Set();

    // Add the starting room to the visited set
    visitedRooms.add(startRoom);

    // Add the starting room's adjacent cells to the list of corridors
    corridors.push(...sketch.findAdjacentCells(startRoom, dungeon));

    // Continue until all rooms are connected
    while (visitedRooms.size < rooms.length) {
      const maxAttempts = 100;
      let attempts = 0;
      let success = false;

      let nearestRoom;
      let corridorCell;
      do {
        // Choose a random corridor cell
        corridorCell = sketch.random(corridors);

        // Find the nearest room to the corridor cell
        nearestRoom = sketch.findNearestRoom(corridorCell, rooms, visitedRooms);

        // Carve passages from the corridor cell to the nearest room
        success = sketch.carvePassages(
          corridorCell,
          nearestRoom,
          dungeon,
          rooms
        );

        attempts++;
      } while (!success && attempts < maxAttempts);

      // Add the nearest room to the visited set
      visitedRooms.add(nearestRoom);

      // Add the nearest room's frontier cells to the list of corridors
      corridors.push(...sketch.findAdjacentCells(nearestRoom, dungeon));

      // Remove the current corridor cell from the list of corridors
      const index = corridors.indexOf(corridorCell);
      if (index !== -1) {
        corridors.splice(index, 1);
      }
    }

    return dungeon;
  };

  sketch.createEmptyDungeon = (numRows, numCols) => {
    const dungeon = [];
    for (let i = 0; i < numRows; i++) {
      const row = [];
      for (let j = 0; j < numCols; j++) {
        // Fill the grid with walls represented by "#" character
        row.push("#");
      }
      dungeon.push(row);
    }
    return dungeon;
  };

  sketch.generateRooms = (numRooms, numRows, numCols) => {
    const minRoomSize = 3; // Adjust as needed
    const maxRoomSize = 6; // Adjust as needed
    const rooms = [{ x: numRows / 2 - 2, y: numRows - 3, width: 4, height: 1 }];

    // Attempt to generate the desired number of rooms
    for (let i = 0; i < numRooms; i++) {
      let room;
      let attempts = 0;
      const maxAttempts = 100; // Maximum number of attempts to generate a room
      let overlaps;

      // Make multiple attempts to generate a non-overlapping room
      do {
        // Generate random width and height for the room
        const roomWidth = Math.floor(sketch.random(minRoomSize, maxRoomSize));
        const roomHeight = Math.floor(sketch.random(minRoomSize, maxRoomSize));

        // Generate random coordinates for the top-left corner of the room
        // Expand the boundaries of the room by one tile in all directions
        const roomX = Math.floor(sketch.random(1, numCols - roomWidth - 2));
        const roomY = Math.floor(sketch.random(1, numRows - roomHeight - 2));

        // Create room object
        room = { x: roomX, y: roomY, width: roomWidth, height: roomHeight };

        // Check if the expanded room overlaps with existing rooms
        overlaps = rooms.some((existingRoom) => {
          return (
            roomX < existingRoom.x + existingRoom.width + 1 &&
            roomX + roomWidth + 1 > existingRoom.x &&
            roomY < existingRoom.y + existingRoom.height + 1 &&
            roomY + roomHeight + 1 > existingRoom.y
          );
        });

        attempts++;
      } while (overlaps && attempts < maxAttempts);

      // If a non-overlapping room is found, add it to the array of rooms
      if (!overlaps) {
        rooms.push(room);
      }
    }

    return rooms;
  };

  sketch.findAdjacentCells = (room) => {
    const adjacentCells = [];
    const { x, y, width, height } = room;

    // Define the boundaries of the room
    const left = x - 1;
    const right = x + width;
    const top = y - 1;
    const bottom = y + height;

    // Iterate through the cells surrounding the room
    for (let i = left; i <= right; i++) {
      for (let j = top; j <= bottom; j++) {
        // Skip cells within the boundaries of the room
        if ((i === x - 1 || i === x + width) && j >= y && j <= y + height - 1) {
          // Cell is to the left or right of the room
          adjacentCells.push({ x: i, y: j });
        } else if (
          (j === y - 1 || j === y + height) &&
          i >= x &&
          i <= x + width - 1
        ) {
          // Cell is above or below the room
          adjacentCells.push({ x: i, y: j });
        }
      }
    }

    return adjacentCells;
  };

  sketch.findNearestRoom = (corridorCell, rooms, visitedRooms) => {
    let nearestRoom = null;
    let minDistance = Number.MAX_SAFE_INTEGER;

    for (const room of rooms) {
      if (!visitedRooms.has(room)) {
        // Calculate the distance between the corridor cell and the center of the room
        const roomCenterX = room.x + Math.floor(room.width / 2);
        const roomCenterY = room.y + Math.floor(room.height / 2);
        const distance =
          Math.abs(corridorCell.x - roomCenterX) +
          Math.abs(corridorCell.y - roomCenterY);

        // Update the nearest room if a closer unvisited room is found
        if (distance < minDistance) {
          minDistance = distance;
          nearestRoom = room;
        }
      }
    }

    return nearestRoom;
  };

  sketch.pickDirection = (x, y, roomX, roomY, prioritizeX) => {
    let dx = 0;
    let dy = 0;

    // Randomly prioritize movement along the x-axis or y-axis first
    if (prioritizeX) {
      // Prioritize movement along the x-axis first
      if (x < roomX) {
        dx = 1; // Move right
      } else if (x > roomX) {
        dx = -1; // Move left
      } else if (y < roomY) {
        dy = 1; // Move down
      } else if (y > roomY) {
        dy = -1; // Move up
      }
    } else {
      // Prioritize movement along the y-axis first
      if (y < roomY) {
        dy = 1; // Move down
      } else if (y > roomY) {
        dy = -1; // Move up
      } else if (x < roomX) {
        dx = 1; // Move right
      } else if (x > roomX) {
        dx = -1; // Move left
      }
    }

    return { dx, dy };
  };

  sketch.carvePassages = (cell, nearestRoom, dungeon, rooms) => {
    // Get the coordinates of the corridor cell and the nearest room
    let x = cell.x;
    let y = cell.y;
    const roomX = Math.floor(
      sketch.random(nearestRoom.x, nearestRoom.x + nearestRoom.width)
    );
    const roomY = Math.floor(
      sketch.random(nearestRoom.y, nearestRoom.y + nearestRoom.height)
    );

    // Store the coordinates of all cells along the path
    const path = [];

    // Randomly choose whether to prioritize movement along the x-axis or y-axis first
    const prioritizeX = sketch.random() < 0.5;

    // Pick initial direction based on the random choice
    let { dx, dy } = sketch.pickDirection(x, y, roomX, roomY, prioritizeX);

    path.push({ x, y });

    // Store all cells along the path until reaching the nearest room
    while (!sketch.isCardinallyAdjacentToRoom(x, y, nearestRoom)) {
      // Move towards the nearest room
      x += dx;
      y += dy;

      path.push({ x, y });

      // Update direction after each move
      ({ dx, dy } = sketch.pickDirection(x, y, roomX, roomY, prioritizeX));
    }

    // Validate the path: check if any cell along the path is inside an existing room
    // and ensure the path doesn't get within 1 tile of an existing room (except for the destination room)
    const validPath = path.every(({ x, y }) => {
      return (
        !rooms.some((existingRoom) => {
          return (
            x >= existingRoom.x - 1 &&
            x < existingRoom.x + existingRoom.width + 1 &&
            y >= existingRoom.y - 1 &&
            y < existingRoom.y + existingRoom.height + 1 &&
            !(
              existingRoom.x === nearestRoom.x &&
              existingRoom.y === nearestRoom.y
            )
          );
        }) ||
        (x === cell.x && y === cell.y)
      );
    });

    // If the path is valid, carve out the entire path
    if (validPath) {
      path.forEach(({ x, y }) => {
        dungeon[y][x] = ".";
      });
      return true;
    }
    return false;
  };

  sketch.isCardinallyAdjacentToRoom = (x, y, room) => {
    return (
      ((x === room.x - 1 || x === room.x + room.width) &&
        y >= room.y &&
        y <= room.y + room.height - 1) ||
      // Cell is to the left or right of the room
      ((y === room.y - 1 || y === room.y + room.height) &&
        x >= room.x &&
        x <= room.x + room.width - 1)
      // Cell is above or below the room
    );
  };

  // Additional functions for adding doors, traps, decorations, etc.

  sketch.gridCheck = (grid, i, j, targets) => {
    // bounds check
    if (i >= 0 && i < grid.length && j >= 0 && j < grid[i].length) {
      for (let target of targets) {
        if (grid[j][i] == target) {
          return true;
        }
      }
    }
    return false;
  };

  sketch.neighborsCode = (grid, i, j, targets) => {
    const northBit = sketch.gridCheck(grid, i, j - 1, targets);
    const southBit = sketch.gridCheck(grid, i, j + 1, targets);
    const eastBit = sketch.gridCheck(grid, i + 1, j, targets);
    const westBit = sketch.gridCheck(grid, i - 1, j, targets);
    const northEastBit = sketch.gridCheck(grid, i + 1, j - 1, targets);
    const northWestBit = sketch.gridCheck(grid, i - 1, j - 1, targets);
    const southEastBit = sketch.gridCheck(grid, i + 1, j + 1, targets);
    const southWestBit = sketch.gridCheck(grid, i - 1, j + 1, targets);

    return (
      (northBit << 0) +
      (southBit << 1) +
      (eastBit << 2) +
      (westBit << 3) +
      (northEastBit << 4) +
      (northWestBit << 5) +
      (southEastBit << 6) +
      (southWestBit << 7)
    );
  };

  sketch.drawContext = (grid, i, j, targets, ti, tj) => {
    const code = sketch.neighborsCode(grid, i, j, targets);
    // render outside corners
    for (let k = 0; k < 4; k++) {
      let [tiOffset, tjOffset] = sketch.lookup[code & (1 << (4 + k))][0]; // Mask for each diagonal
      sketch.placeTile(i, j, ti + tiOffset, tj + tjOffset);
    }

    // render inside corners/edges
    for (let [tiOffset, tjOffset] of sketch.lookup[code & 15]) {
      // Mask off all diagonals
      sketch.placeTile(i, j, ti + tiOffset, tj + tjOffset);
    }
  };

  sketch.lookup = new Array(255).fill([[1, 1]]);
  sketch.lookup[0] = [[1, 1]]; // No Neighbors
  sketch.lookup[1] = [[1, 0]]; // North
  sketch.lookup[2] = [[1, 2]]; // South
  sketch.lookup[3] = [
    [1, 0],
    [1, 2],
  ]; // North + South
  sketch.lookup[4] = [[2, 1]]; // East
  sketch.lookup[5] = [[2, 0]]; // North + East
  sketch.lookup[6] = [[2, 2]]; // South + East
  sketch.lookup[7] = [
    [2, 0],
    [1, 2],
  ]; // North + South + East
  sketch.lookup[8] = [[0, 1]]; // West
  sketch.lookup[9] = [[0, 0]]; // North + West
  sketch.lookup[10] = [[0, 2]]; // South + West
  sketch.lookup[11] = [
    [0, 0],
    [1, 2],
  ]; // North + South + West
  sketch.lookup[12] = [
    [2, 1],
    [0, 1],
  ]; // East + West
  sketch.lookup[13] = [
    [2, 0],
    [0, 0],
  ]; // North + East + West
  sketch.lookup[14] = [
    [2, 2],
    [0, 2],
  ]; // South + East + West
  sketch.lookup[15] = [
    [2, 0],
    [0, 0],
    [1, 2],
  ]; // North + South + East + West
  sketch.lookup[16] = [[3, 1]]; // Northeast
  sketch.lookup[32] = [[4, 1]]; // Northwest
  sketch.lookup[64] = [[3, 0]]; // Southeast
  sketch.lookup[128] = [[4, 0]]; // Southwest

  sketch.drawGrid = (grid) => {
    sketch.background(128);

    for (let j = 0; j < grid.length; j += 1) {
      for (let i = 0; i < grid[j].length; i += 1) {
        // Walls
        if (sketch.gridCheck(grid, i, j, ["#"])) {
          sketch.placeTile(i, j, 0, 23);
        }
        // Floor
        if (sketch.gridCheck(grid, i, j, ["."])) {
          let tileX, tileY;
          if (sketch.random() > 0.2) {
            [tileX, tileY] = [10, 23]; // No Leaves
            sketch.random(); // keep same amount of random calls on each iteration
          } else {
            tileX = Math.floor(sketch.random(15, 19)); // Random floor Tile
            tileY = 24;
          }
          sketch.placeTile(i, j, tileX, tileY);
          if (sketch.random() < 0.02) {
            sketch.placeTile(
              i,
              j,
              Math.floor(sketch.random(0, 6)),
              Math.floor(sketch.random(28, 31))
            ); // Chest
          }
          if (sketch.gridCheck(grid, i, j - 1, ["#"])) {
            sketch.placeTile(
              i,
              j - 1,
              Math.floor(sketch.random(1, 5)),
              Math.floor(sketch.random(21, 25))
            ); // Wall Deco
            if (sketch.random() < 0.1) {
              sketch.placeTile(
                i,
                j - 1,
                Math.floor(sketch.random(5, 8)),
                Math.floor(sketch.random(25, 28))
              ); // Door
            }
          }
        }
        // Water
        if (sketch.gridCheck(grid, i, j, ["~"])) {
          let tileX;
          if (
            sketch.noise(
              i + sketch.millis() / 10000,
              j + sketch.millis() / 1000
            ) > 0.16
          ) {
            tileX = 0; // No Bubbles
            sketch.random(); // keep same amount of random calls on each iteration
          } else {
            tileX = sketch.random([1, 2, 3]); // Random Bubble Tile
          }
          sketch.placeTile(i, j, tileX, 14);
          // Convert water to Canal next to Land
          sketch.drawContext(grid, i, j, ["#", "."], 5, 21);
          if (sketch.gridCheck(grid, i, j - 1, ["#"])) {
            sketch.placeTile(
              i,
              j - 1,
              Math.floor(sketch.random(1, 5)),
              Math.floor(sketch.random(21, 25))
            );
          }
        }
      }
    }
  };
};

let world2 = new p5(w2);