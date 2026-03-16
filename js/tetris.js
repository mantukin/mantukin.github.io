      (function() {
        const canvas = document.getElementById('tetris-canvas');
        if (!canvas) return;
        const heroShell = canvas.parentElement;
        if (!heroShell) return;
        const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        if (!ctx) return;
        const performanceQuery = window.matchMedia(
          '(max-width: 720px), (pointer: coarse), (prefers-reduced-motion: reduce)'
        );

        let cols = 0;
        let rows = 0;
        let blockSize = 24;
        let yOffset = 0;
        let board = [];
        let lowPowerMode = false;
        let frameInterval = 0;
        let gridOpacity = 0.25;
        let heroVisible = true;
        let scrollPauseUntil = 0;
        const scrollPauseMs = 160;

        const CODE_SNIPPETS = [
          "const data = await res.json();",
          "function update() {",
          "if (!x) return false;",
          "export default Component;",
          "import { memo } from 'react';",
          "console.log('done');",
          "let index = -1;",
          "while (alive) { loop(); }",
          "document.querySelector('.app')",
          "Object.entries(cfg).map()"
        ];
        const COLORS = ['#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#EAB308', '#3B82F6'];
        const SHAPES = [
          [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
          [[1,0,0], [1,1,1], [0,0,0]], // J
          [[0,0,1], [1,1,1], [0,0,0]], // L
          [[1,1], [1,1]], // O
          [[0,1,1], [1,1,0], [0,0,0]], // S
          [[0,1,0], [1,1,1], [0,0,0]], // T
          [[1,1,0], [0,1,1], [0,0,0]]  // Z
        ];

        function applyPerformanceProfile() {
          lowPowerMode = performanceQuery.matches;
          blockSize = lowPowerMode ? 32 : 24;
          frameInterval = lowPowerMode ? 1000 / 24 : 0;
          gridOpacity = lowPowerMode ? 0.14 : 0.25;
          dropInterval = lowPowerMode ? 120 : 80;
          canvas.style.opacity = lowPowerMode ? '0.24' : '0.35';
        }

        function resize() {
          applyPerformanceProfile();

          const rect = heroShell.getBoundingClientRect();
          canvas.width = Math.max(1, Math.floor(rect.width));
          canvas.height = Math.max(1, Math.floor(rect.height));
          cols = Math.ceil(canvas.width / blockSize);
          rows = Math.ceil(canvas.height / blockSize);
          yOffset = canvas.height - (rows * blockSize);

          const previousCols = board[0]?.length || 0;
          let newBoard = Array.from({length: rows}, () => Array(cols).fill(null));
          for (let r = 0; r < Math.min(rows, board.length); r++) {
            for (let c = 0; c < Math.min(cols, previousCols); c++) {
              newBoard[rows - 1 - r][c] = board[board.length - 1 - r][c];
            }
          }
          board = newBoard;
        }

        window.addEventListener('resize', resize);
        window.addEventListener('scroll', markScrollActivity, { passive: true });
        window.addEventListener('touchmove', markScrollActivity, { passive: true });
        document.addEventListener('visibilitychange', () => {
          lastTime = 0;
          lastRenderTime = 0;
          scrollPauseUntil = 0;
        });

        if (typeof performanceQuery.addEventListener === 'function') {
          performanceQuery.addEventListener('change', resize);
        } else if (typeof performanceQuery.addListener === 'function') {
          performanceQuery.addListener(resize);
        }

        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver(
            (entries) => {
              heroVisible = entries[0]?.isIntersecting ?? true;
              if (heroVisible) {
                lastTime = 0;
                lastRenderTime = 0;
                scrollPauseUntil = 0;
              }
            },
            { threshold: 0.08 }
          );
          observer.observe(heroShell);
        }

        function markScrollActivity() {
          if (!lowPowerMode) return;
          scrollPauseUntil = performance.now() + scrollPauseMs;
        }

        function rotate(matrix) {
          const N = matrix.length;
          const res = Array.from({length: N}, () => Array(N).fill(0));
          for (let i = 0; i < N; ++i) {
            for (let j = 0; j < N; ++j) {
              res[j][N - 1 - i] = matrix[i][j];
            }
          }
          return res;
        }

        function checkCollision(x, y, matrix) {
          for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
              if (!matrix[r][c]) continue;
              let nx = x + c;
              let ny = y + r;
              if (nx < 0 || nx >= cols || ny >= rows) return true;
              if (ny >= 0 && board[ny][nx]) return true;
            }
          }
          return false;
        }

        class Piece {
          constructor() {
            const typeId = Math.floor(Math.random() * SHAPES.length);
            this.matrix = SHAPES[typeId];
            this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.text = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
            this.x = Math.floor(cols / 2) - Math.floor(this.matrix.length / 2);
            this.y = 0;
            this.targetX = this.x;
            this.targetRotations = 0;
            this.currentRotations = 0;
            this.spawnTicks = 0;
            this.calculateBestMove();
          }

          calculateBestMove() {
            let bestScore = -Infinity;
            let bestX = this.x;
            let bestRotations = 0;
            let currentMatrix = this.matrix;

            for (let rot = 0; rot < 4; rot++) {
              let minX = -currentMatrix.length;
              let maxX = cols;
              for (let tx = minX; tx < maxX; tx++) {
                if (checkCollision(tx, 0, currentMatrix)) continue;

                let ty = 0;
                while (!checkCollision(tx, ty + 1, currentMatrix)) {
                  ty++;
                }

                let score = this.evaluateMove(tx, ty, currentMatrix);
                if (score > bestScore || (score === bestScore && Math.random() > 0.5)) {
                  bestScore = score;
                  bestX = tx;
                  bestRotations = rot;
                }
              }
              currentMatrix = rotate(currentMatrix);
            }

            // Simulate a "miss-drop" human error 5% of the time so the AI isn't perfect
            if (Math.random() < 0.05) {
              bestX = Math.max(0, Math.min(cols - 1, bestX + (Math.random() > 0.5 ? 1 : -1)));
            }

            this.targetX = bestX;
            this.targetRotations = bestRotations;
          }

          evaluateMove(x, y, matrix) {
            let tempBoard = board.map(row => [...row]);
            for (let r = 0; r < matrix.length; r++) {
              for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c]) {
                  let ny = y + r;
                  let nx = x + c;
                  if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                    tempBoard[ny][nx] = 1;
                  }
                }
              }
            }

            let completeLines = 0;
            let holes = 0;
            let bumpiness = 0;
            let heights = Array(cols).fill(0);

            for (let c = 0; c < cols; c++) {
              let foundBlock = false;
              for (let r = 0; r < rows; r++) {
                if (tempBoard[r][c]) {
                  if (!foundBlock) {
                    heights[c] = rows - r;
                    foundBlock = true;
                  }
                } else if (foundBlock) {
                  holes++;
                }
              }
            }

            for (let r = 0; r < rows; r++) {
              if (tempBoard[r].every(cell => cell)) completeLines++;
            }

            for (let c = 0; c < cols - 1; c++) {
              bumpiness += Math.abs(heights[c] - heights[c+1]);
            }

            let maxHeight = Math.max(...heights);
            return (completeLines * 10) - (holes * 5) - (bumpiness * 1) - (maxHeight * 0.1) + (y * 0.5);
          }

          moveDown() {
            this.spawnTicks++;
            
            // Wait 2 ticks before reacting (with drop interval 80, that's 160ms reaction time)
            if (this.spawnTicks > 2) {

              // Rotate much faster if we need to catch up
              if (this.currentRotations < this.targetRotations) {
                if (Math.random() > 0.05) {
                  // Try to do up to 2 rotations per tick if needed
                  for (let r = 0; r < 2 && this.currentRotations < this.targetRotations; r++) {
                    let nextMatrix = rotate(this.matrix);
                    if (!checkCollision(this.x, this.y, nextMatrix)) {
                      this.matrix = nextMatrix;
                      this.currentRotations++;
                    } else {
                      this.targetRotations = this.currentRotations; // Give up on rotation if stuck
                      break;
                    }
                  }
                }
              }

              // Move horizontally faster to catch up
              if (this.x !== this.targetX) {
                if (Math.random() > 0.02) {
                  const dir = this.targetX > this.x ? 1 : -1;
                  // If we are far, move up to 4 blocks per tick to ensure we reach the edges quickly
                  const distance = Math.abs(this.targetX - this.x);
                  const moves = distance > 5 ? 4 : (distance > 2 ? 3 : 2);
                  
                  for (let i = 0; i < moves; i++) {
                    if (this.x !== this.targetX) {
                      if (!checkCollision(this.x + dir, this.y, this.matrix)) {
                        this.x += dir;
                      } else {
                        break;
                      }
                    }
                  }
                }
              }
            }

            if (!checkCollision(this.x, this.y + 1, this.matrix)) {
              this.y++;
              return true;
            }
            return false;
          }
          lock() {
            let lockedTextIndex = 0;
            for (let r = 0; r < this.matrix.length; r++) {
              for (let c = 0; c < this.matrix[r].length; c++) {
                if (this.matrix[r][c]) {
                  let ny = this.y + r;
                  let nx = this.x + c;
                  if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                    let char = this.text[lockedTextIndex % this.text.length];
                    board[ny][nx] = { color: this.color, char: char };
                    lockedTextIndex++;
                  }
                }
              }
            }
          }
        }

        let activePiece = null;
        let lastTime = 0;
        let lastRenderTime = 0;
        let dropInterval = 80;
        let dropCounter = 0;

        function clearLines() {
          for (let r = rows - 1; r >= 0; r--) {
            if (board[r].every(cell => cell)) {
              board.splice(r, 1);
              board.unshift(Array(cols).fill(null));
              r++; 
            }
          }
        }

        function drawBlock(nx, ny, color, char) {
          let px = nx * blockSize;
          let py = ny * blockSize + yOffset;

          ctx.fillStyle = '#0a1720';
          ctx.globalAlpha = 1.0;
          ctx.fillRect(px, py, blockSize, blockSize);

          ctx.fillStyle = color;
          ctx.globalAlpha = 0.15;
          ctx.fillRect(px, py, blockSize, blockSize);

          ctx.globalAlpha = 1.0;
          ctx.fillText(char, px + blockSize/2, py + blockSize/2 + 1);
        }

        function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let gridOffset = (lastTime / 50) % blockSize;
          ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let c = 0; c <= cols + 1; c++) {
            let px = c * blockSize;
            ctx.moveTo(px, 0);
            ctx.lineTo(px, canvas.height);
          }
          for (let r = -1; r <= rows + 1; r++) {
            let py = r * blockSize + yOffset + gridOffset;
            ctx.moveTo(0, py);
            ctx.lineTo(canvas.width, py);
          }
          ctx.stroke();

          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              let cell = board[r][c];
              if (cell) {
                drawBlock(c, r, cell.color, cell.char);
              }
            }
          }

          if (activePiece) {
            let textIndex = 0;
            for (let r = 0; r < activePiece.matrix.length; r++) {
              for (let c = 0; c < activePiece.matrix[r].length; c++) {
                if (activePiece.matrix[r][c]) {
                  let nx = activePiece.x + c;
                  let ny = activePiece.y + r;
                  if (ny >= 0) {
                    let char = activePiece.text[textIndex % activePiece.text.length];
                    drawBlock(nx, ny, activePiece.color, char);
                    textIndex++;
                  }
                }
              }
            }
          }
        }

        function update(time = 0) {
          if (document.hidden || !heroVisible) {
            lastTime = time;
            lastRenderTime = time;
            requestAnimationFrame(update);
            return;
          }

          if (lowPowerMode && time < scrollPauseUntil) {
            lastTime = time;
            lastRenderTime = time;
            requestAnimationFrame(update);
            return;
          }

          if (frameInterval && lastRenderTime && time - lastRenderTime < frameInterval) {
            requestAnimationFrame(update);
            return;
          }

          const deltaTime = time - lastTime;
          lastTime = time;
          lastRenderTime = time;

          if (!activePiece) {
            activePiece = new Piece();
            if (checkCollision(activePiece.x, activePiece.y, activePiece.matrix)) {
              // Game over: clear the board
              board = Array.from({length: rows}, () => Array(cols).fill(null));
            }
          }

          dropCounter += deltaTime;
          if (dropCounter > dropInterval) {
            if (!activePiece.moveDown()) {
              activePiece.lock();
              clearLines();
              activePiece = null;
            }
            dropCounter = 0;
          }

          draw();
          requestAnimationFrame(update);
        }

        resize();
        update();
      })();
    
