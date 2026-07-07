document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const playerSprite = document.getElementById('playerSprite');
    const bgMusic = document.getElementById('bgMusic');
    
    // UI Elements
    const scoreVal = document.getElementById('scoreVal');
    const startOverlay = document.getElementById('startOverlay');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const startBtn = document.getElementById('startBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const finalScoreEl = document.getElementById('finalScore');

    // Canvas Settings
    canvas.width = 800;
    canvas.height = 400;

    // Game Variables
    let gameLoopId;
    let isPlaying = false;
    let score = 0;
    let frameCount = 0;
    let gameSpeed = 5;

    // Player (MJ)
    const player = {
        x: 50,
        y: 200,
        width: 60,
        height: 60,
        dy: 0,
        jumpPower: -12,
        gravity: 0.6,
        grounded: false,
        draw() {
            playerSprite.style.display = 'block';
            playerSprite.style.left = `${this.x}px`;
            playerSprite.style.top = `${this.y}px`;
        },
        update() {
            this.dy += this.gravity;
            this.y += this.dy;

            // Ground Collision (Floor is at height - 40)
            if (this.y + this.height >= canvas.height - 40) {
                this.y = canvas.height - 40 - this.height;
                this.dy = 0;
                this.grounded = true;
            } else {
                this.grounded = false;
            }
        },
        jump() {
            if (this.grounded) {
                this.dy = this.jumpPower;
                this.grounded = false;
            }
        }
    };

    // Obstacles
    let obstacles = [];

    class Obstacle {
        constructor() {
            this.type = Math.random() > 0.5 ? 'zombie' : 'tombstone';
            this.width = this.type === 'zombie' ? 30 : 40;
            this.height = this.type === 'zombie' ? 50 : 35;
            this.x = canvas.width;
            this.y = canvas.height - 40 - this.height;
        }

        draw() {
            if (this.type === 'zombie') {
                // Zombie (Green)
                ctx.fillStyle = '#4caf50';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x + 5, this.y + 10, 5, 5);
                ctx.fillRect(this.x + 15, this.y + 10, 5, 5);
            } else {
                // Tombstone (Grey)
                ctx.fillStyle = '#7f8c8d';
                ctx.beginPath();
                ctx.roundRect(this.x, this.y, this.width, this.height, [10, 10, 0, 0]);
                ctx.fill();
            }
        }

        update() {
            this.x -= gameSpeed;
        }
    }

    // Input Handling
    function handleInput(e) {
        if (!isPlaying) return;
        if (e.type === 'keydown' && (e.code === 'Space' || e.code === 'ArrowUp')) {
            e.preventDefault();
            player.jump();
        }
        if (e.type === 'mousedown' || e.type === 'touchstart') {
            player.jump();
        }
    }

    window.addEventListener('keydown', handleInput);
    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', handleInput, {passive: true});

    // Game Functions
    function resetGame() {
        player.y = 200;
        player.dy = 0;
        obstacles = [];
        score = 0;
        frameCount = 0;
        gameSpeed = 5;
        scoreVal.textContent = 0;
        startOverlay.classList.remove('show');
        gameOverOverlay.classList.remove('show');
        isPlaying = true;
        
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log('Audio error:', e));

        gameLoop();
    }

    function checkCollision(p, o) {
        return (
            p.x < o.x + o.width &&
            p.x + p.width > o.x &&
            p.y < o.y + o.height &&
            p.y + p.height > o.y
        );
    }

    function gameOver() {
        isPlaying = false;
        cancelAnimationFrame(gameLoopId);
        finalScoreEl.textContent = Math.floor(score);
        gameOverOverlay.classList.add('show');
        bgMusic.pause();
        playerSprite.style.display = 'none';
    }

    function drawEnvironment() {
        // Floor
        ctx.fillStyle = '#0f3460'; // Match canvas background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

        // Simple stars/particles
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for(let i=0; i<10; i++) {
            ctx.fillRect(((frameCount * 0.5 + i * 100) % canvas.width), (i*37) % 200, 2, 2);
        }
    }

    function gameLoop() {
        if (!isPlaying) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawEnvironment();

        // Player
        player.update();
        player.draw();

        // Obstacles
        if (frameCount % Math.max(60, Math.floor(120 - gameSpeed * 5)) === 0) {
            obstacles.push(new Obstacle());
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].update();
            obstacles[i].draw();

            if (checkCollision(player, obstacles[i])) {
                gameOver();
                return;
            }

            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
            }
        }

        // Score & Difficulty
        score += 0.1;
        scoreVal.textContent = Math.floor(score);
        
        if (frameCount % 600 === 0) { // Every ~10 seconds
            gameSpeed += 0.5;
        }

        frameCount++;
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Event Listeners for UI
    startBtn.addEventListener('click', resetGame);
    playAgainBtn.addEventListener('click', resetGame);

    // Initial Render
    drawEnvironment();
    player.draw();
});
