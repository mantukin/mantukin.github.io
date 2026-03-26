      (function() {
        const canvas = document.getElementById('tetris-canvas');
        if (!canvas) return;
        const heroShell = canvas.parentElement;
        if (!heroShell) return;
        const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        if (!ctx) return;
        const performanceQuery = window.matchMedia(
          '(max-width: 980px), (prefers-reduced-motion: reduce)'
        );

        let cols = 0;
        let rows = 0;
        let blockSize = 24;
        let yOffset = 0;
        let board = [];
        let lowPowerMode = false;
        let frameInterval = 0;
        let gridOpacity = 0.7;
        let blockOpacity = 0.15;
        let canvasOpacity = 0.4;
        let gridOpacityScale = 1;
        let canvasOpacityScale = 1;
        let heroVisible = true;
        let needsRedraw = false;
        let scrollPauseUntil = 0;
        let resizeFrame = 0;
        let started = false;
        let readyObserver = null;
        const scrollPauseMs = 160;
        const pausedFrameInterval = 1000 / 8;

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
        const FALLBACK_CHARS = "{}[]();:<>+-/*=&|!#@%?$0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const LINE_CLEAR_THRESHOLD = 3;
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
          gridOpacityScale = lowPowerMode ? 0.56 : 1;
          canvasOpacityScale = lowPowerMode ? (0.24 / 0.35) : 1;
          dropInterval = lowPowerMode ? 120 : 80;
          canvas.style.opacity = String(
            Math.max(0, Math.min(1, canvasOpacity * canvasOpacityScale))
          );
        }

        function syncCanvasSize(force = false) {
          const previousBlockSize = blockSize;
          applyPerformanceProfile();

          const rect = heroShell.getBoundingClientRect();
          const nextWidth = Math.max(
            1,
            Math.round(rect.width || heroShell.clientWidth || canvas.clientWidth || 0)
          );
          const nextHeight = Math.max(
            1,
            Math.round(rect.height || heroShell.clientHeight || canvas.clientHeight || 0)
          );
          const sizeChanged =
            force ||
            canvas.width !== nextWidth ||
            canvas.height !== nextHeight ||
            previousBlockSize !== blockSize;

          if (!sizeChanged) {
            return false;
          }

          canvas.width = nextWidth;
          canvas.height = nextHeight;
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

          if (activePiece) {
            const maxX = Math.max(0, cols - activePiece.matrix[0].length);
            activePiece.x = Math.max(0, Math.min(maxX, activePiece.x));
            activePiece.targetX = Math.max(0, Math.min(maxX, activePiece.targetX));
            activePiece.y = Math.max(-activePiece.matrix.length + 1, Math.min(rows - 1, activePiece.y));
          }

          needsRedraw = true;
          return true;
        }

        function scheduleResize(force = false) {
          if (resizeFrame) {
            cancelAnimationFrame(resizeFrame);
          }

          resizeFrame = requestAnimationFrame(() => {
            resizeFrame = 0;
            const resized = syncCanvasSize(force);
            if (!resized) {
              return;
            }

            if (started) {
              draw();
            }
          });
        }

        function resetFrameClock() {
          lastTime = 0;
          lastRenderTime = 0;
          scrollPauseUntil = 0;
        }

        function attachRuntimeObservers() {
          window.addEventListener('resize', () => scheduleResize());
          window.addEventListener('load', () => scheduleResize(true), { once: true });
          window.addEventListener('pageshow', () => scheduleResize(true));
          window.addEventListener('app-shell-ready', () => scheduleResize(true));
          window.addEventListener('profile-content-ready', () => scheduleResize(true));
          window.addEventListener('scroll', markScrollActivity, { passive: true });
          window.addEventListener('touchmove', markScrollActivity, { passive: true });
          document.addEventListener('visibilitychange', resetFrameClock);

          if (document.fonts && typeof document.fonts.ready?.then === 'function') {
            document.fonts.ready.finally(() => {
              scheduleResize(true);
            });
          }

          if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(() => {
              scheduleResize();
            });
            resizeObserver.observe(heroShell);
          }

          if (typeof performanceQuery.addEventListener === 'function') {
            performanceQuery.addEventListener('change', () => scheduleResize(true));
          } else if (typeof performanceQuery.addListener === 'function') {
            performanceQuery.addListener(() => scheduleResize(true));
          }

          if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(
              (entries) => {
                heroVisible = entries[0]?.isIntersecting ?? true;
                if (heroVisible) {
                  resetFrameClock();
                  scheduleResize();
                }
              },
              { threshold: 0.08 }
            );
            observer.observe(heroShell);
          }
        }

        function start() {
          if (started) {
            return;
          }

          started = true;
          if (readyObserver) {
            readyObserver.disconnect();
            readyObserver = null;
          }
          attachRuntimeObservers();
          syncCanvasSize(true);
          draw();
          requestAnimationFrame(() => scheduleResize(true));
          update();
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
            const rawText = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
            // Remove spaces to ensure every block has a visible character
            this.text = rawText.replace(/\s+/g, '') || FALLBACK_CHARS;
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

            // Simulate a "miss-drop" human error 3% of the time so the AI isn't perfect
            if (Math.random() < 0.03) {
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

            let completedRows = [];
            for (let r = 0; r < rows; r++) {
              if (tempBoard[r].every(cell => cell)) completedRows.push(r);
            }

            // Find max consecutive lines
            let maxConsecutive = 0;
            let currentConsecutive = 0;
            if (completedRows.length > 0) {
              currentConsecutive = 1;
              maxConsecutive = 1;
              for (let i = 1; i < completedRows.length; i++) {
                if (completedRows[i] === completedRows[i - 1] + 1) {
                  currentConsecutive++;
                } else {
                  currentConsecutive = 1;
                }
                if (currentConsecutive > maxConsecutive) maxConsecutive = currentConsecutive;
              }
            }

            const clearsThisMove = maxConsecutive >= LINE_CLEAR_THRESHOLD ? maxConsecutive : 0;
            const preparedLines = completedRows.length > 0 && maxConsecutive < LINE_CLEAR_THRESHOLD ? maxConsecutive : 0;
            let maxHeight = Math.max(...heights);
            return (clearsThisMove * 18) + (preparedLines * 3) - (holes * 5) - (bumpiness * 1) - (maxHeight * 0.1) + (y * 0.5);
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
                    let char = this.text[lockedTextIndex % this.text.length] || 
                               FALLBACK_CHARS[Math.floor(Math.random() * FALLBACK_CHARS.length)];
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
          const completedRows = [];
          for (let r = rows - 1; r >= 0; r--) {
            if (board[r].every(cell => cell)) {
              completedRows.push(r);
            }
          }

          if (completedRows.length === 0) return 0;

          // Group consecutive rows (completedRows is sorted bottom to top, so indices are decreasing)
          const groups = [];
          let currentGroup = [completedRows[0]];
          for (let i = 1; i < completedRows.length; i++) {
            if (completedRows[i] === completedRows[i - 1] - 1) {
              currentGroup.push(completedRows[i]);
            } else {
              groups.push(currentGroup);
              currentGroup = [completedRows[i]];
            }
          }
          groups.push(currentGroup);

          // Identify rows that belong to a group of at least 3
          const rowsToClear = groups
            .filter(group => group.length >= LINE_CLEAR_THRESHOLD)
            .flat();

          if (rowsToClear.length === 0) return 0;

          // Sort rows to clear from bottom to top to keep splicing consistent
          rowsToClear.sort((a, b) => b - a);

          for (const rowIndex of rowsToClear) {
            board.splice(rowIndex, 1);
            board.unshift(Array(cols).fill(null));
          }

          return rowsToClear.length;
        }

        function drawBlock(nx, ny, color, char) {
          let px = nx * blockSize;
          let py = ny * blockSize + yOffset;

          ctx.fillStyle = '#0a1720';
          ctx.globalAlpha = 1.0;
          ctx.fillRect(px, py, blockSize, blockSize);

          ctx.fillStyle = color;
          ctx.globalAlpha = Math.max(0, Math.min(1, blockOpacity));
          ctx.fillRect(px, py, blockSize, blockSize);

          ctx.globalAlpha = 1.0;
          ctx.fillText(char, px + blockSize/2, py + blockSize/2 + 1);
        }

        function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let gridOffset = (lastTime / 50) % blockSize;
          ctx.globalAlpha = Math.max(0, Math.min(1, gridOpacity * gridOpacityScale));
          ctx.strokeStyle = '#ffffff';
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
          ctx.globalAlpha = 1.0;

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
                    let char = activePiece.text[textIndex % activePiece.text.length] || 
                               FALLBACK_CHARS[Math.floor(Math.random() * FALLBACK_CHARS.length)];
                    drawBlock(nx, ny, activePiece.color, char);
                    textIndex++;
                  }
                }
              }
            }
          }
          needsRedraw = false;
        }

        function update(time = 0) {
          if (document.hidden || !heroVisible) {
            lastTime = time;
            lastRenderTime = time;
            requestAnimationFrame(update);
            return;
          }

          if (lowPowerMode && time < scrollPauseUntil) {
            if (needsRedraw || !lastRenderTime || time - lastRenderTime >= pausedFrameInterval) {
              draw();
              lastRenderTime = time;
            }
            lastTime = time;
            requestAnimationFrame(update);
            return;
          }

          if (frameInterval && lastRenderTime && time - lastRenderTime < frameInterval) {
            requestAnimationFrame(update);
            return;
          }

          const deltaTime = lastTime ? Math.min(time - lastTime, dropInterval) : 0;
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

        function startWhenReady() {
          const body = document.body;
          if (!body) {
            document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });
            return;
          }

          if (body.dataset.appReady === 'true') {
            start();
            return;
          }

          readyObserver = new MutationObserver(() => {
            if (body.dataset.appReady === 'true') {
              readyObserver.disconnect();
              readyObserver = null;
              start();
            }
          });

          readyObserver.observe(body, {
            attributes: true,
            attributeFilter: ['data-app-ready']
          });

          window.addEventListener('load', () => {
            if (!started) {
              start();
            }
          }, { once: true });
        }

        startWhenReady();
      })();
    
