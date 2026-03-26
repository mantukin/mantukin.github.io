      (function() {
        const body = document.body;
        if (!body) return;

        const disablePatternQuery = window.matchMedia('(max-width: 980px)');
        let patternStarted = false;
        let patternPending = false;
        let startupTriggered = false;

        function updatePattern() {
          patternPending = false;
          patternStarted = true;

          if (disablePatternQuery.matches) {
            body.style.removeProperty('--bg-pattern');
            return;
          }

          const canvas = document.createElement('canvas');
          const size = 512;
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            body.style.removeProperty('--bg-pattern');
            return;
          }

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

          body.style.setProperty('--bg-pattern', `url(${canvas.toDataURL()})`);
        }

        function scheduleInitialPattern() {
          if (startupTriggered || patternStarted || patternPending) {
            return;
          }

          startupTriggered = true;
          patternPending = true;

          if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(updatePattern, { timeout: 400 });
            return;
          }

          window.setTimeout(updatePattern, 120);
        }

        function refreshPattern() {
          if (patternPending) {
            return;
          }

          if (patternStarted) {
            updatePattern();
            return;
          }

          scheduleInitialPattern();
        }

        if (typeof disablePatternQuery.addEventListener === 'function') {
          disablePatternQuery.addEventListener('change', refreshPattern);
        } else if (typeof disablePatternQuery.addListener === 'function') {
          disablePatternQuery.addListener(refreshPattern);
        }

        if (body.dataset.profileReady === 'true') {
          scheduleInitialPattern();
          return;
        }

        window.addEventListener('profile-content-ready', scheduleInitialPattern, { once: true });
        window.setTimeout(scheduleInitialPattern, 2800);
      })();
    
