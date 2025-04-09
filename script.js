// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set background color
canvas.style.backgroundColor = 'black';

// Player plane properties
const playerPlane = {
  x: canvas.width / 2,
  y: canvas.height - 30,
  size: 15,
  color: 'white',
  speed: 5 // Added player movement speed
};

// Player bullets array
const bullets = [];
const bulletSpeed = 7;
const bulletSize = 5;
const bulletColor = 'yellow';

// Enemy planes array
const enemyPlanes = [];
const initialEnemySize = 15;
const enemySizeMultiplier = 1.5; // 50% bigger initially
let enemySize = initialEnemySize * enemySizeMultiplier;
const enemySizeReductionRate = 0.02; // 2% reduction
const pointsForEnemySizeReduction = 200;
const initialEnemySpeed = 100;
let currentBaseEnemySpeed = initialEnemySpeed;
const enemyColor = 'orangered';

// Player lives
let lives = 3;
const maxLives = 3;
const heartSize = 15;
const heartSpacing = 5;

// High score list (now stores all scores)
const highScoreList = [];

// Game state variables
let score = 0;
let gameSpeedMultiplier = 1;
let lastFrameTime = 0;
const pointsForSpeedIncrease = 200; // Threshold for speed increase
const speedIncreaseAmount = 0.05; // Amount to increase speed by
let enemySpawnInterval = 1000;
const initialEnemySpawnInterval = enemySpawnInterval;
let lastEnemySpawnTime = 0;
let gameOver = false;
const keys = {}; // Object to track pressed keys

// --- Helper Functions ---

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function createEnemyPlane() {
  const x = getRandomNumber(0, canvas.width - enemySize);
  const y = -enemySize;
  const speed = currentBaseEnemySpeed * gameSpeedMultiplier;
  enemyPlanes.push({ x, y, size: enemySize, speed, color: enemyColor, alive: true });
}

function updateEnemyPlanes(deltaTime) {
  for (let i = 0; i < enemyPlanes.length; i++) {
    if (enemyPlanes[i].alive) {
      enemyPlanes[i].y += enemyPlanes[i].speed * deltaTime;

      if (enemyPlanes[i].y > canvas.height + enemySize) {
        lives--;
        enemyPlanes.splice(i, 1);
        i--;
        console.log("Missed an enemy! Lives left:", lives);
        if (lives <= 0) {
          endRound();
        }
      }
    } else {
      enemyPlanes.splice(i, 1);
      i--;
    }
  }
}

function createBullet(x = playerPlane.x, y = playerPlane.y - playerPlane.size / 2 - bulletSize / 2) {
  if (!gameOver) {
    bullets.push({ x: x, y: y, size: bulletSize, speed: bulletSpeed, color: bulletColor });
  }
}

function updateBullets(deltaTime) {
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].y -= bullets[i].speed * deltaTime * 100;

    if (bullets[i].y < -bullets[i].size) {
      bullets.splice(i, 1);
      i--;
    }
  }
}

function checkBulletCollisions() {
  for (let i = 0; i < bullets.length; i++) {
    for (let j = 0; j < enemyPlanes.length; j++) {
      if (enemyPlanes[j].alive) {
        const bullet = bullets[i];
        const enemy = enemyPlanes[j];

        if (
          bullet.x > enemy.x &&
          bullet.x < enemy.x + enemy.size &&
          bullet.y > enemy.y &&
          bullet.y < enemy.y + enemy.size
        ) {
          bullets.splice(i, 1);
          i--;
          enemyPlanes[j].alive = false;
          score += 10; // Increment score here

          // Check for speed increase after scoring
          if (!gameOver && score * 10 > 0 && (score * 10) % pointsForSpeedIncrease === 0) {
            gameSpeedMultiplier += speedIncreaseAmount;
            console.log(`Game speed multiplier increased to ${gameSpeedMultiplier.toFixed(2)}x!`);
          }

          // Check for enemy size reduction
          if (!gameOver && score * 10 > 0 && (score * 10) % pointsForEnemySizeReduction === 0) {
            enemySize *= (1 - enemySizeReductionRate);
            enemySize = Math.max(5, enemySize); // Ensure enemy size doesn't get too small
            console.log(`Enemy size reduced to ${enemySize.toFixed(2)}!`);
          }
          break;
        }
      }
    }
  }
}

function checkCollisions() {
  for (let i = 0; i < enemyPlanes.length; i++) {
    if (enemyPlanes[i].alive) {
      const enemy = enemyPlanes[i];
      const dx = playerPlane.x - (enemy.x + enemy.size / 2);
      const dy = playerPlane.y - (enemy.y + enemy.size / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < playerPlane.size / 2 + enemy.size / 2) {
        lives--;
        enemyPlanes.splice(i, 1);
        i--;
        console.log("Collided with enemy! Lives left:", lives);
        if (lives <= 0) {
          endRound();
        }
        return true;
      }
    }
  }
  return false;
}

function drawHeart(x, y, size, isFilled) {
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y + size / 4);
  ctx.bezierCurveTo(x + size / 2, y, x + size, y, x + size, y + size / 4);
  ctx.bezierCurveTo(x + size, y + size / 2, x + size / 2, y + size * 3 / 4, x + size / 2, y + size);
  ctx.bezierCurveTo(x + size / 2, y + size * 3 / 4, x, y + size / 2, x, y + size / 4);
  ctx.bezierCurveTo(x, y, x + size / 2, y, x + size / 2, y + size / 4);
  ctx.closePath();
  if (isFilled) {
    ctx.fillStyle = 'red';
    ctx.fill();
  } else {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawLivesDisplay() {
  for (let i = 0; i < maxLives; i++) {
    const x = 10 + i * (heartSize + heartSpacing);
    const y = 40;
    drawHeart(x, y, heartSize, i < lives);
  }
}

function drawPlayerPlane() {
  ctx.fillStyle = playerPlane.color;
  ctx.fillRect(playerPlane.x - playerPlane.size / 2, playerPlane.y - playerPlane.size / 2, playerPlane.size, playerPlane.size);
}

function drawEnemyPlanes() {
  for (const enemy of enemyPlanes) {
    if (enemy.alive) {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
    }
  }
}

function drawBullets() {
  ctx.fillStyle = bulletColor;
  for (const bullet of bullets) {
    ctx.fillRect(bullet.x - bullet.size / 2, bullet.y - bullet.size / 2, bullet.size, bullet.size);
  }
}

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText(`Score: ${score * 2}`, 10, 20);
}

function drawSpeed() {
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.fillText(`Speed: ${gameSpeedMultiplier.toFixed(2)}x`, 10, canvas.height - 20);
}

function calculateAverageScore() {
  if (highScoreList.length === 0) {
    return 0;
  }
  const sum = highScoreList.reduce((acc, val) => acc + val, 0);
  return sum / highScoreList.length;
}

function drawTopScores() {
  const sortedScores = [...highScoreList].sort((a, b) => b - a);
  ctx.fillStyle = 'white';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Top Scores', canvas.width / 2, canvas.height / 2 + 50);
  ctx.font = '14px Arial';
  for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
    ctx.fillText(`${i + 1}. ${sortedScores[i]}`, canvas.width / 2, canvas.height / 2 + 70 + i * 20);
  }
  ctx.textAlign = 'start';
}

function drawGameOver() {
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 60);
  ctx.font = '16px Arial';
  ctx.fillText(`Final Score: ${score * 2}`, canvas.width / 2, canvas.height / 2 - 30);
  const averageScore = calculateAverageScore();
  ctx.fillText(`Average Score: ${averageScore.toFixed(0)}`, canvas.width / 2, canvas.height / 2);
  ctx.font = '18px Arial';
  ctx.fillText('Press Space to Continue', canvas.width / 2, canvas.height / 2 + 30);
  drawTopScores();
  ctx.textAlign = 'start';
}

function updatePlayer(deltaTime) {
  if (!gameOver) {
    if (keys['ArrowLeft']) {
      playerPlane.x -= playerPlane.speed * deltaTime * 60;
    }
    if (keys['ArrowRight']) {
      playerPlane.x += playerPlane.speed * deltaTime * 60;
    }
    playerPlane.x = Math.max(playerPlane.size / 2, Math.min(canvas.width - playerPlane.size / 2, playerPlane.x));
  }
}

function updateGame(currentTime) {
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  if (!gameOver) {
    updatePlayer(deltaTime);
    updateEnemyPlanes(deltaTime);
    updateBullets(deltaTime);
    checkBulletCollisions();
    checkCollisions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayerPlane();
    drawEnemyPlanes();
    drawBullets();
    drawScore();
    drawSpeed(); // Draw the speed counter
    drawLivesDisplay();
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGameOver();
  }

  requestAnimationFrame(updateGame);
}

function endRound() {
  gameOver = true;
  highScoreList.push(score * 2);
}

function resetGame() {
  gameOver = false;
  score = 0;
  lives = maxLives;
  gameSpeedMultiplier = 1;
  enemySize = initialEnemySize * enemySizeMultiplier; // Reset enemy size
  currentBaseEnemySpeed = initialEnemySpeed;
  playerPlane.x = canvas.width / 2; // Reset player position
  enemyPlanes.length = 0;
  bullets.length = 0;
  lastEnemySpawnTime = 0;
  keys = {}; // Reset pressed keys
}

canvas.addEventListener('mousemove', (event) => {
  if (!gameOver && !keys['ArrowLeft'] && !keys['ArrowRight']) { // Only track mouse if arrow keys are not pressed
    const rect = canvas.getBoundingClientRect();
    playerPlane.x = event.clientX - rect.left;
  }
});

canvas.addEventListener('click', (event) => {
  if (!gameOver && !keys['Space']) { // Only shoot on click if spacebar isn't held
    createBullet();
  } else if (gameOver) {
    resetGame();
  }
});

document.addEventListener('keydown', (event) => {
  keys[event.key] = true;
  if (event.key === ' ') {
    if (gameOver) {
      resetGame();
    } else if (!gameOver) {
      createBullet();
    }
  }
});

document.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

function spawnEnemies(currentTime) {
  if (!gameOver && currentTime - lastEnemySpawnTime > enemySpawnInterval) {
    createEnemyPlane();
    lastEnemySpawnTime = currentTime;
  }
  requestAnimationFrame(spawnEnemies);
}

// --- Game Initialization ---
requestAnimationFrame(updateGame);
requestAnimationFrame(spawnEnemies);
