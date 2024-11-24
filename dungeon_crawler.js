// Game setup
const DUNGEON_SIZE = 16;
const TREASURE_COUNT = 10;
const MONSTER_COUNT = 15;

// Restart game function
function restartGame() {
    // Reset game state
    playerPosition = { x: 0, z: 0 };
    treasures = [];
    monsters = [];
    treasuresCollected = 0;
    isGameOver = false;
    frameCount = 0;

    // Clear existing objects
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    // Recreate floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(DUNGEON_SIZE, DUNGEON_SIZE),
        new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide })
    );
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    // Recreate player
    player.position.set(0, 0.25, 0);
    scene.add(player);

    // Reinitialize game
    initGame();

    // Reset message and treasure count
    showMessage("");
    updateTreasureCount();

    // Re-add event listener
    document.addEventListener('keydown', handleKeyPress);
}

// Game state
let playerPosition = { x: 0, z: 0 };
let treasures = [];
let monsters = [];
let treasuresCollected = 0;
let isGameOver = false;
let frameCount = 0;

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Lighting
scene.add(new THREE.AmbientLight(0x404040));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Create floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(DUNGEON_SIZE, DUNGEON_SIZE),
    new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide })
);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

// Create player
const player = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
scene.add(player);

// Create object function
function createObject(color) {
    return new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 32, 32),
        new THREE.MeshBasicMaterial({ color: color })
    );
}

// Initialize game
function initGame() {
    for (let i = 0; i < TREASURE_COUNT; i++) placeTreasure();
    for (let i = 0; i < MONSTER_COUNT; i++) placeMonster();
    document.addEventListener('keydown', handleKeyPress);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
}

// Place object function
function placeObject(objectType, color) {
    let x, z;
    do {
        x = Math.floor(Math.random() * DUNGEON_SIZE) - DUNGEON_SIZE / 2;
        z = Math.floor(Math.random() * DUNGEON_SIZE) - DUNGEON_SIZE / 2;
    } while (isPositionOccupied(x, z));
    const object = createObject(color);
    object.position.set(x, 0.2, z);
    scene.add(object);
    return { x, z, object };
}

// Place treasure
function placeTreasure() {
    treasures.push(placeObject('treasure', 0xffff00));
}

// Place monster
function placeMonster() {
    monsters.push(placeObject('monster', 0xff0000));
}

// Check if position is occupied
function isPositionOccupied(x, z) {
    return (playerPosition.x === x && playerPosition.z === z) ||
           treasures.some(t => t.x === x && t.z === z) ||
           monsters.some(m => m.x === x && m.z === z);
}

// Move monsters
function moveMonsters() {
    monsters.forEach(monster => {
        const direction = Math.floor(Math.random() * 4);
        const [dx, dz] = [[0, -1], [1, 0], [0, 1], [-1, 0]][direction];
        const newX = monster.x + dx;
        const newZ = monster.z + dz;
        if (newX >= -DUNGEON_SIZE / 2 && newX < DUNGEON_SIZE / 2 && 
            newZ >= -DUNGEON_SIZE / 2 && newZ < DUNGEON_SIZE / 2 && 
            !isPositionOccupied(newX, newZ)) {
            monster.x = newX;
            monster.z = newZ;
            monster.object.position.set(newX, 0.2, newZ);
        }
    });
}

// Move player
function movePlayer(dx, dz) {
    const newX = playerPosition.x + dx;
    const newZ = playerPosition.z + dz;
    if (newX >= -DUNGEON_SIZE / 2 && newX < DUNGEON_SIZE / 2 && 
        newZ >= -DUNGEON_SIZE / 2 && newZ < DUNGEON_SIZE / 2) {
        playerPosition.x = newX;
        playerPosition.z = newZ;
        player.position.set(newX, 0.25, newZ);
        checkCollisions();
    }
}

// Check collisions
function checkCollisions() {
    const treasureIndex = treasures.findIndex(t => t.x === playerPosition.x && t.z === playerPosition.z);
    if (treasureIndex !== -1) {
        scene.remove(treasures[treasureIndex].object);
        treasures.splice(treasureIndex, 1);
        treasuresCollected++;
        updateTreasureCount();
        if (treasuresCollected === TREASURE_COUNT) {
            endGame("Gratulacje, zebrałeś wszystkie skarby!");
        }
    }
    if (monsters.some(m => m.x === playerPosition.x && m.z === playerPosition.z)) {
        endGame("O nie, dopadł cię potwór!");
    }
}

// Handle key press
function handleKeyPress(event) {
    if (isGameOver) return;
    const moves = { 'w': [0, -1], 'a': [-1, 0], 's': [0, 1], 'd': [1, 0] };
    const move = moves[event.key.toLowerCase()];
    if (move) movePlayer(...move);
    else if (event.key.toLowerCase() === 'q') endGame("Dzięki za grę!");
}

// Show message
function showMessage(text) {
    document.getElementById('message').textContent = text;
}

// Update treasure count
function updateTreasureCount() {
    document.getElementById('treasures-count').textContent = `Skarby: ${treasuresCollected}/${TREASURE_COUNT}`;
}

// End game
function endGame(message) {
  showMessage(message);
  isGameOver = true;
  document.removeEventListener('keydown', handleKeyPress);
  
  if (treasuresCollected === TREASURE_COUNT) {
      setTimeout(() => {
          if (confirm("You won! Do you want to play again?")) {
              restartGame();
          }
      }, 1000);
  }
}

// Handle key press
function handleKeyPress(event) {
  if (isGameOver) {
      if (event.key.toLowerCase() === 'r') {
          restartGame();
      }
      return;
  }
  const moves = { 'w': [0, -1], 'a': [-1, 0], 's': [0, 1], 'd': [1, 0] };
  const move = moves[event.key.toLowerCase()];
  if (move) movePlayer(...move);
  else if (event.key.toLowerCase() === 'q') endGame("Dzięki za grę!");
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    if (!isGameOver && frameCount % 60 === 0) moveMonsters();
    frameCount++;
    renderer.render(scene, camera);
}

// Start the game
initGame();
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});