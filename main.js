var debug = { x: [], y: [], food: [] };

(function (debug) {
  var canvas = document.getElementById("myCanvas");
  var msg = document.getElementById('msg');
  var actualScore = document.getElementById('actual-score');
  var bestScore = document.getElementById('best-score');
  var countFPS = document.getElementById('count-fps');
  var ctx = canvas.getContext("2d");
  var gameOn = 0;
  var speed = 2;
  var endGame = new Event('endGame');
  var scores = createScores();
  var interval;
  var anim;
  var foodCount = 0; // Track normal food eaten

  document.addEventListener("keydown", function spaceHandler(e) {
    if (e.keyCode === 32) {
      e.preventDefault();
      if (!gameOn) {
        msg.innerHTML = 'Go!';
        msg.style.color = '#00ff00';
        gameOn = 1;
        game();
      }
    }
  }, false);

  document.addEventListener('endGame', function (e) {
    msg.innerHTML = 'Game Over! Press Space to Restart';
    msg.style.color = '#ff4444';
    gameOn = 0;
    window.cancelAnimationFrame(anim);
    clearInterval(interval);
    scores.stop();
  });

  function game() {
    var snake = createSnake(speed);
    var food = createFood(canvas.width, canvas.height, "#ffd700"); // Yellow normal food
    var specialFood = createSpecialFood(canvas.width, canvas.height); // Red special food
    var nextDir = '';
    var fps = 0;

    scores.start();

    document.addEventListener('keydown', arrowsHandler, false);

    function arrowsHandler(e) {
      switch (e.keyCode) {
        case 83: case 40: nextDir = 'down'; e.preventDefault(); break;
        case 68: case 39: nextDir = 'right'; e.preventDefault(); break;
        case 38: case 87: nextDir = 'up'; e.preventDefault(); break;
        case 65: case 37: nextDir = 'left'; e.preventDefault(); break;
      }
    }

    function play() {
      fps++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(26, 42, 108, 0.8)');
      gradient.addColorStop(1, 'rgba(253, 187, 45, 0.8)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if ((snake.x[0] % 10 === 0) && (snake.y[0] % 10 === 0)) {
        snake.update();
        snake.changeDir(nextDir);
      }
      snake.move();

      if (snake.isEating(food.x, food.y)) {
        food.spawn(snake.x, snake.y);
        snake.grow();
        scores.incr(1);
        foodCount++;
        if (foodCount === 5) {
          foodCount = 0; // Reset counter
          specialFood.active = true;
          specialFood.spawn(snake.x, snake.y);
          setTimeout(() => specialFood.active = false, 10000); // Disappears after 10 seconds
        }
      }

      if (specialFood.active && snake.isEating(specialFood.x, specialFood.y)) {
        specialFood.active = false;
        snake.grow(); snake.grow(); // Extra growth for special food
        scores.incr(10); // 10 extra points
      }

      food.draw(ctx);
      if (specialFood.active) specialFood.draw(ctx);
      snake.draw(ctx);

      if (snake.collides(canvas.width, canvas.height)) {
        document.dispatchEvent(endGame);
      } else {
        anim = window.requestAnimationFrame(play);
      }
      debug.x = snake.x;
      debug.y = snake.y;
      debug.food = [food.x, food.y];
    }

    interval = setInterval(() => {
      countFPS.innerText = fps;
      fps = 0;
    }, 1000);

    food.spawn(snake.x, snake.y);
    anim = window.requestAnimationFrame(play);
  }

  function createFood(width, height, color) {
    return {
      x: 0, y: 0, color: color,
      spawn: function (posX, posY) {
        var matrix = [], free = [];
        for (let i = 0; i < 40; i++) matrix[i] = Array(40).fill(0);
        for (let i = 0; i < posX.length; i++) {
          let x = Math.floor(posX[i] / 10);
          let y = Math.floor(posY[i] / 10);
          matrix[y][x] = 1;
        }
        for (let i = 0; i < 40; i++) {
          for (let j = 0; j < 40; j++) {
            if (!matrix[i][j]) free.push([i, j]);
          }
        }
        let foodPos = Math.floor(Math.random() * free.length);
        this.x = free[foodPos][1] * 10;
        this.y = free[foodPos][0] * 10;
      },
      draw: function (ctx) {
        ctx.save();
        // 3D effect with radial gradient
        let gradient = ctx.createRadialGradient(this.x + 5, this.y + 5, 2, this.x + 5, this.y + 5, 6);
        gradient.addColorStop(0, '#ffffff'); // Highlight
        gradient.addColorStop(1, this.color); // Base color
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y + 5, 5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
      }
    };
  }

  function createSpecialFood(width, height) {
    let specialFood = createFood(width, height, "#ff0000"); // Red color
    specialFood.active = false;
    specialFood.draw = function (ctx) {
      ctx.save();
      // Pulsing 3D effect
      let size = 5 + Math.sin(Date.now() / 200) * 1; // Slight pulsing
      let gradient = ctx.createRadialGradient(this.x + 5, this.y + 5, 2, this.x + 5, this.y + 5, 6);
      gradient.addColorStop(0, '#ff6666'); // Lighter red highlight
      gradient.addColorStop(1, this.color); // Base red
      ctx.beginPath();
      ctx.arc(this.x + 5, this.y + 5, size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.closePath();
      ctx.restore();
    };
    return specialFood;
  }

  function createSnake(speed) {
    return {
      x: [0], y: [0], dx: [speed], dy: [0],
      changeDir: function (nextDir) {
        if (this.dx[0] && nextDir === 'up') { this.dx[0] = 0; this.dy[0] = -speed; }
        if (this.dx[0] && nextDir === 'down') { this.dx[0] = 0; this.dy[0] = speed; }
        if (this.dy[0] && nextDir === 'right') { this.dx[0] = speed; this.dy[0] = 0; }
        if (this.dy[0] && nextDir === 'left') { this.dx[0] = -speed; this.dy[0] = 0; }
      },
      draw: function (ctx) {
        for (let i = 0; i < this.x.length; i++) {
          ctx.save();
          // 3D effect with gradient and shadow
          let gradient = ctx.createLinearGradient(this.x[i], this.y[i], this.x[i] + 10, this.y[i] + 10);
          gradient.addColorStop(0, i === 0 ? '#00ff00' : '#2B823A'); // Head or body color
          gradient.addColorStop(1, i === 0 ? '#006600' : '#1a4f25'); // Darker shade
          ctx.beginPath();
          ctx.rect(this.x[i], this.y[i], 10, 10);
          ctx.fillStyle = gradient;
          ctx.shadowBlur = 8;
          ctx.shadowColor = i === 0 ? '#00ff00' : '#2B823A';
          ctx.fill();
          // Add a slight shine
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(this.x[i] + 2, this.y[i] + 2, 4, 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.closePath();
          ctx.restore();
        }
      },
      update: function () {
        this.dx = this.dx.slice().map((el, i) => i ? this.dx[i - 1] : el);
        this.dy = this.dy.slice().map((el, i) => i ? this.dy[i - 1] : el);
      },
      grow: function () {
        let lastX = this.x[this.x.length - 1];
        let lastY = this.y[this.y.length - 1];
        let lastDX = this.dx[this.dx.length - 1];
        let lastDY = this.dy[this.dy.length - 1];
        this.x.push(lastX - (Math.sign(lastDX) * 10));
        this.y.push(lastY - (Math.sign(lastDY) * 10));
        this.dx.push(lastDX);
        this.dy.push(lastDY);
      },
      isEating: function (foodX, foodY) {
        return this.x[0] === foodX && this.y[0] === foodY;
      },
      move: function () {
        for (let i = 0; i < this.x.length; i++) {
          this.x[i] += this.dx[i];
          this.y[i] += this.dy[i];
        }
      },
      collides: function (width, height) {
        let x = this.x[0], y = this.y[0];
        if (x < 0 || x + 10 > width || y < 0 || y + 10 > height) return true;
        for (let i = 1; i < this.x.length; i++) {
          if (x === this.x[i] && y === this.y[i]) return true;
        }
        return false;
      }
    };
  }

  function createScores() {
    var best = 0, score;
    return {
      start: function () { score = 0; actualScore.innerText = '0'; },
      incr: function (n) { score += n; actualScore.innerText = score; },
      stop: function () { if (score > best) { best = score; bestScore.innerText = best; } }
    };
  }
})(debug);