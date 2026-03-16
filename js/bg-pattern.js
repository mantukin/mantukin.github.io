      (function() {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const gridSize = 16;
        const cols = size / gridSize;
        const rows = size / gridSize;

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (Math.random() > 0.85) {
              ctx.fillStyle = Math.random() > 0.5 ? '#444' : '#222';
              const w = Math.floor(Math.random() * 3) + 1;
              const h = Math.floor(Math.random() * 3) + 1;
              ctx.fillRect(x * gridSize, y * gridSize, w * gridSize, h * gridSize);
            }
          }
        }
        document.body.style.setProperty('--bg-pattern', `url(${canvas.toDataURL()})`);
      })();
    