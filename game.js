// Game Configuration
const config = {
    gridSize: 20,
    tileCount: 20,
    initialSpeed: 150,
    speedIncrease: 0.95,
    colors: {
        snakeHead: '#4f46e5',
        snakeBody: '#6366f1',
        food: '#ec4899',
        glow: '0 0 10px rgba(99, 102, 241, 0.8)'
    }
};

// Game State
let canvas, ctx;
let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop;
let isPaused = false;
let gameOver = false;
let gameSpeed = config.initialSpeed;
let lastTimestamp = 0;
let gridSize, tileCount;

// DOM Elements
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverElement = document.getElementById('gameOver');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    // Always hide the game over overlay at start
    gameOverElement.classList.add('hidden');
    
    // Set canvas size based on viewport
    resizeCanvas();
    window.addEventListener('resize', () => {
    resizeCanvas();
    // Re-center snake after resize
    snake = [
        { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }
    ];
    dx = 0;
    dy = 0;
    score = 0;
    gameOver = false;
    isPaused = false;
    generateFood();
    scoreElement.textContent = score;
    gameOverElement.classList.add('hidden');
gameOverElement.style.display = 'none';
});
    
    // Initialize game state
    resetGame();
    
    // Event Listeners
    document.addEventListener('keydown', handleKeyPress);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', resetGame);
    playAgainBtn.addEventListener('click', resetGame);

    // Mobile controls
    document.querySelectorAll('.mobile-btn').forEach(btn => {
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleMobileDirection(this.dataset.dir);
        });
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            handleMobileDirection(this.dataset.dir);
        });
    });

    // Swipe gesture support
    let touchStartX = 0, touchStartY = 0;
    const threshold = 30; // Minimum px for swipe
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    });
    document.addEventListener('touchend', function(e) {
        if (e.changedTouches.length === 1) {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
                handleMobileDirection(dx > 0 ? 'right' : 'left');
            } else if (Math.abs(dy) > threshold) {
                handleMobileDirection(dy > 0 ? 'down' : 'up');
            }
        }
    });
    
    // Start the game loop
    window.requestAnimationFrame(gameUpdate);

// Handle mobile direction
function handleMobileDirection(dir) {
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;
    if (dir === 'left' && !goingRight) {
        dx = -1; dy = 0;
    } else if (dir === 'up' && !goingDown) {
        dx = 0; dy = -1;
    } else if (dir === 'right' && !goingLeft) {
        dx = 1; dy = 0;
    } else if (dir === 'down' && !goingUp) {
        dx = 0; dy = 1;
    }
}

}

// Resize canvas to fit container while maintaining aspect ratio
function resizeCanvas() {
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth - 40, 500);
    
    // Calculate grid size and tile count based on available space
    tileCount = config.tileCount;
    gridSize = Math.floor(size / tileCount);
    
    // Adjust canvas size to fit the grid perfectly
    const canvasSize = gridSize * tileCount;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    // The game loop will handle redrawing, no need to call drawGame() here.
}

// Reset the game to initial state
function resetGame() {
    // Clear the game loop
    if (gameLoop) cancelAnimationFrame(gameLoop);
    
    // Reset game state
    snake = [
        { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }
    ];
    
    dx = 0;
    dy = 0;
    score = 0;
    gameSpeed = config.initialSpeed;
    gameOver = false;
    isPaused = false;
    
    // Update UI
    scoreElement.textContent = score;
    // Always hide the overlay on reset
    gameOverElement.classList.add('hidden');
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    
    // Generate first food
    generateFood();
    
    // Start the game loop
    lastTimestamp = 0;
    gameLoop = window.requestAnimationFrame(gameUpdate);
}

// Main game loop
function gameUpdate(timestamp) {
    if (isPaused || gameOver) {
        gameLoop = window.requestAnimationFrame(gameUpdate);
        return;
    }

    if (timestamp - lastTimestamp > gameSpeed) {
        lastTimestamp = timestamp;

        // Only move the snake if a direction is set
        if (dx !== 0 || dy !== 0) {
            moveSnake();

            if (checkCollision()) {
                endGame();
                return;
            }
        }

        drawGame();
    }

    gameLoop = window.requestAnimationFrame(gameUpdate);
}

// Move the snake
function moveSnake() {
    if (dx === 0 && dy === 0) return;
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        gameSpeed *= config.speedIncrease;
        generateFood();
    } else {
        snake.pop();
    }
}

// Check for collisions
function checkCollision() {
    const head = snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Generate food at random position
function generateFood() {
    let validPosition = false;
    let foodX, foodY;
    
    while (!validPosition) {
        foodX = Math.floor(Math.random() * tileCount);
        foodY = Math.floor(Math.random() * tileCount);
        
        validPosition = !snake.some(segment => segment.x === foodX && segment.y === foodY);
    }
    
    food = { x: foodX, y: foodY };
}

// Draw the game
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawFood();
    drawSnake();
}

// Draw the grid
function drawGrid() {
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

// Draw the snake
function drawSnake() {
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const size = gridSize - 1;
        
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, size, size, 4);
        } else {
            ctx.rect(x, y, size, size);
        }
        
        if (isHead) {
            const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
            gradient.addColorStop(0, config.colors.snakeHead);
            gradient.addColorStop(1, config.colors.snakeBody);
            ctx.fillStyle = gradient;
            ctx.shadowColor = config.colors.snakeHead;
            ctx.shadowBlur = 15;
        } else {
            const alpha = 0.7 - (index / snake.length) * 0.5;
            ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// Draw the food
function drawFood() {
    const x = food.x * gridSize;
    const y = food.y * gridSize;
    const size = gridSize - 1;
    
    const gradient = ctx.createRadialGradient(
        x + size/2, y + size/2, 0,
        x + size/2, y + size/2, size/2
    );
    gradient.addColorStop(0, '#ec4899');
    gradient.addColorStop(1, '#be185d');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = config.colors.food;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, size, size, 6);
    } else {
        ctx.rect(x, y, size, size);
    }
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Handle key presses
function handleKeyPress(e) {
    const key = e.key;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if ((key === 'ArrowLeft' || key === 'a') && !goingRight) {
        dx = -1; dy = 0;
    } else if ((key === 'ArrowUp' || key === 'w') && !goingDown) {
        dx = 0; dy = -1;
    } else if ((key === 'ArrowRight' || key === 'd') && !goingLeft) {
        dx = 1; dy = 0;
    } else if ((key === 'ArrowDown' || key === 's') && !goingUp) {
        dx = 0; dy = 1;
    } else if (key === ' ') { // Space bar to pause/resume
        e.preventDefault();
        togglePause();
    }
}

// Toggle pause state
function togglePause() {
    isPaused = !isPaused;
    pauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
}

// End the game
function endGame() {
    gameOver = true;
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
    gameOverElement.style.display = 'flex';
}

// Start the game on window load
window.onload = init;
