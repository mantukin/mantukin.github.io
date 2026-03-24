      const README_URL = "https://raw.githubusercontent.com/mantukin/mantukin/main/README.md";
      const REPO_RAW_ROOT = "https://raw.githubusercontent.com/mantukin/mantukin/main/";
      const REPO_BLOB_ROOT = "https://github.com/mantukin/mantukin/blob/main/";
      const STATS_SNAPSHOT_URL = new URL("repo_icons/github-stats/snapshot.json", REPO_RAW_ROOT).href;
      const GITHUB_USER = "mantukin";
      const GITHUB_PROFILE_URL = "https://github.com/" + GITHUB_USER;
      const GITHUB_USER_API_URL = "https://api.github.com/users/" + GITHUB_USER;
      const GITHUB_AVATAR_FALLBACK_URL = GITHUB_PROFILE_URL + ".png?size=160";
      const GITHUB_STATS_CACHE_KEY = "mantukin.github.io.stats-snapshot.v1";
      const TECH_STACK_BADGE_ROOT = "assets/tech-stack-badges/";
      const TECH_STACK_BADGE_MAP = Object.freeze({
        rust: { path: "rust.svg", label: "Rust" },
        tauri: { path: "tauri.svg", label: "Tauri" },
        python: { path: "python.svg", label: "Python" },
        typescript: { path: "typescript.svg", label: "TypeScript" },
        javascript: { path: "javascript.svg", label: "JavaScript" },
        html5: { path: "html5.svg", label: "HTML5" },
        html: { path: "html5.svg", label: "HTML5" },
        css3: { path: "css3.svg", label: "CSS3" },
        css: { path: "css3.svg", label: "CSS3" },
        blender: { path: "blender.svg", label: "Blender" },
      });
      let githubProfileData = null;
      let githubStatsSnapshotPromise = null;
      const STATS_CARD_ICON_PATHS = Object.freeze([
        {
          fillRule: "evenodd",
          path: "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z",
        },
        {
          fillRule: "evenodd",
          path: "M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z",
        },
        {
          fillRule: "evenodd",
          path: "M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z",
        },
        {
          fillRule: "evenodd",
          path: "M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z",
        },
        {
          fillRule: "evenodd",
          path: "M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z",
        },
      ]);
      const STATS_GITHUB_MARK_PATH =
        "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";
      const STREAK_FIRE_PATH =
        "M 1.5 0.67 C 1.5 0.67 2.24 3.32 2.24 5.47 C 2.24 7.53 0.89 9.2 -1.17 9.2 C -3.23 9.2 -4.79 7.53 -4.79 5.47 L -4.76 5.11 C -6.78 7.51 -8 10.62 -8 13.99 C -8 18.41 -4.42 22 0 22 C 4.42 22 8 18.41 8 13.99 C 8 8.6 5.41 3.79 1.5 0.67 Z M -0.29 19 C -2.07 19 -3.51 17.6 -3.51 15.86 C -3.51 14.24 -2.46 13.1 -0.7 12.74 C 1.07 12.38 2.9 11.53 3.92 10.16 C 4.31 11.45 4.51 12.81 4.51 14.2 C 4.51 16.85 2.36 19 -0.29 19 Z";

      const contentShell = document.getElementById("content-shell");
      const projectsContent = document.getElementById("projects-content");
      const stackContent = document.getElementById("stack-content");
      const statsContent = document.getElementById("stats-content");
      const statusPanel = document.getElementById("status-panel");
      const heroDescription = document.getElementById("hero-description");
      const heroStatus = document.getElementById("hero-status");
      const heroStatusDetail = document.getElementById("hero-status-detail");
      const statusMeter = document.getElementById("status-meter");
      const heroAvatar = document.getElementById("hero-avatar");
      const heroAvatarFallback = document.getElementById("hero-avatar-fallback");
      const heroProfileLink = document.getElementById("hero-profile-link");
      const HERO_TAGLINE_FALLBACK =
        "Every tool here started as a personal itch - something I needed, couldn't find, and decided to build myself.";

      function withAvatarSize(source, size = 160) {
        try {
          const url = new URL(source, window.location.href);
          url.searchParams.set("size", String(size));
          return url.href;
        } catch {
          return GITHUB_AVATAR_FALLBACK_URL;
        }
      }

      function withVersionedAsset(path) {
        if (window.location.protocol === "file:") {
          return path;
        }

        if (typeof window.__versionedAsset === "function") {
          return window.__versionedAsset(path);
        }

        return path;
      }

      function applyProfileAvatar(source) {
        if (!heroAvatar || !heroAvatarFallback) {
          return;
        }

        heroAvatar.hidden = true;
        heroAvatarFallback.hidden = false;
        heroAvatar.dataset.retryState = "primary";

        heroAvatar.onload = () => {
          heroAvatar.hidden = false;
          heroAvatarFallback.hidden = true;
        };

        heroAvatar.onerror = () => {
          if (heroAvatar.dataset.retryState === "fallback") {
            heroAvatar.hidden = true;
            heroAvatarFallback.hidden = false;
            return;
          }

          heroAvatar.dataset.retryState = "fallback";
          heroAvatar.src = GITHUB_AVATAR_FALLBACK_URL;
        };

        heroAvatar.src = withAvatarSize(source);
      }

      async function loadProfileAvatar() {
        if (heroProfileLink) {
          heroProfileLink.href = GITHUB_PROFILE_URL;
        }

        try {
          const response = await fetch(GITHUB_USER_API_URL, {
            headers: {
              Accept: "application/vnd.github+json",
            },
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("GitHub avatar request failed with status " + response.status);
          }

          const profile = await response.json();
          githubProfileData = profile;
          applyProfileAvatar(profile.avatar_url || GITHUB_AVATAR_FALLBACK_URL);
        } catch (error) {
          console.warn("Avatar load failed, falling back to direct GitHub avatar URL.", error);
          applyProfileAvatar(GITHUB_AVATAR_FALLBACK_URL);
        }
      }

      function normalizeHeading(text) {
        return (text || "")
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      function cleanDisplayText(text) {
        return (text || "")
          .replace(/\u00a0/g, " ")
          .replace(/`([^`]+)`/g, "$1")
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/\s+/g, " ")
          .trim();
      }

      function normalizeToken(text) {
        return cleanDisplayText(text)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");
      }

      function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }

      function toRawAssetUrl(relativePath) {
        return new URL(relativePath.replace(/^\.?\//, ""), REPO_RAW_ROOT).href;
      }

      function toBlobUrl(relativePath) {
        return new URL(relativePath.replace(/^\.?\//, ""), REPO_BLOB_ROOT).href;
      }

      function rewriteRelativeSrcset(value) {
        return value
          .split(",")
          .map((entry) => {
            const trimmed = entry.trim();
            if (!trimmed) {
              return trimmed;
            }

            const parts = trimmed.split(/\s+/);
            const source = parts.shift();
            if (!source || /^(https?:|data:)/i.test(source)) {
              return trimmed;
            }

            return [toRawAssetUrl(source), ...parts].join(" ");
          })
          .join(", ");
      }

      function rewriteRelativeAssets(container) {
        for (const image of container.querySelectorAll("img")) {
          const source = image.getAttribute("src");
          if (source && !/^(https?:|data:)/i.test(source)) {
            image.setAttribute("src", toRawAssetUrl(source));
          }
        }

        for (const source of container.querySelectorAll("source")) {
          const srcset = source.getAttribute("srcset");
          if (!srcset) {
            continue;
          }

          if (!/^(https?:|data:)/i.test(srcset.trim())) {
            source.setAttribute("srcset", rewriteRelativeSrcset(srcset));
            continue;
          }
        }

        for (const link of container.querySelectorAll("a")) {
          const href = link.getAttribute("href");
          if (!href) {
            continue;
          }

          if (/^(https?:|mailto:|#)/i.test(href)) {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noreferrer");
            continue;
          }

          link.setAttribute("href", toBlobUrl(href));
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noreferrer");
        }
      }

      function createNode(tagName, className, text) {
        const node = document.createElement(tagName);
        if (className) {
          node.className = className;
        }
        if (text !== undefined) {
          node.textContent = text;
        }
        return node;
      }

      function createLink(label, href, className) {
        const link = document.createElement("a");
        link.className = className;
        link.href = href;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = label;
        return link;
      }

      function escapeSvgText(value) {
        return String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function formatStatNumber(value) {
        return new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(Number(value) || 0);
      }

      function createSvgElement(markup) {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(markup, "image/svg+xml");
        const svg = parsed.documentElement;
        if (!svg || svg.nodeName.toLowerCase() === "parsererror") {
          throw new Error("Could not parse stats SVG template.");
        }

        return document.importNode(svg, true);
      }

      function createStatsSvgCard(svgMarkup, wide) {
        const frame = createNode("article", "stat-card");
        if (wide) {
          frame.classList.add("stat-card-wide");
        }

        frame.appendChild(createSvgElement(svgMarkup));
        return frame;
      }

      function polarToPoint(radius, angleDeg) {
        const radians = (angleDeg * Math.PI) / 180;
        const x = Math.cos(radians) * radius;
        const y = Math.sin(radians) * radius;
        return `${x},${y}`;
      }

      function getCirclePoint(cx, cy, radius, angleDeg) {
        const radians = (angleDeg * Math.PI) / 180;
        return {
          x: cx + Math.cos(radians) * radius,
          y: cy + Math.sin(radians) * radius,
        };
      }

      function describeOpenCircleArc(cx, cy, radius, startAngleDeg, endAngleDeg) {
        const start = getCirclePoint(cx, cy, radius, startAngleDeg);
        const end = getCirclePoint(cx, cy, radius, endAngleDeg);
        let sweep = endAngleDeg - startAngleDeg;
        while (sweep <= 0) {
          sweep += 360;
        }

        const largeArc = sweep > 180 ? 1 : 0;
        return `M${start.x.toFixed(3)} ${start.y.toFixed(3)} A${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
      }

      function describeDonutSegment(startAngleDeg, endAngleDeg, outerRadius, innerRadius) {
        const sweep = Math.max(0.0001, endAngleDeg - startAngleDeg);
        const largeArc = sweep > 180 ? 1 : 0;
        const outerStart = polarToPoint(outerRadius, startAngleDeg);
        const outerEnd = polarToPoint(outerRadius, endAngleDeg);
        const innerEnd = polarToPoint(innerRadius, endAngleDeg);
        const innerStart = polarToPoint(innerRadius, startAngleDeg);

        return `M${outerStart}A${outerRadius},${outerRadius},0,${largeArc},1,${outerEnd}L${innerEnd}A${innerRadius},${innerRadius},0,${largeArc},0,${innerStart}Z`;
      }

      function collectSectionNodes(container, targetHeading) {
        const heading = Array.from(container.querySelectorAll("h2")).find(
          (node) => normalizeHeading(node.textContent) === targetHeading
        );

        if (!heading) {
          return [];
        }

        const nodes = [];
        let cursor = heading.nextElementSibling;
        while (cursor && cursor.tagName !== "H2") {
          nodes.push(cursor.cloneNode(true));
          cursor = cursor.nextElementSibling;
        }
        return nodes;
      }

      function assembleNodes(nodes) {
        const wrapper = document.createElement("div");
        for (const node of nodes) {
          wrapper.appendChild(node.cloneNode(true));
        }
        return wrapper;
      }

      function readCachedStatsSnapshot() {
        try {
          const raw = window.localStorage.getItem(GITHUB_STATS_CACHE_KEY);
          if (!raw) {
            return null;
          }

          const parsed = JSON.parse(raw);
          if (!parsed || typeof parsed.timestamp !== "number" || !parsed.data) {
            return null;
          }

          return parsed;
        } catch {
          return null;
        }
      }

      function parseStatsSnapshotPayload(payload) {
        if (!payload || typeof payload !== "object") {
          return null;
        }

        const snapshot = payload.data && typeof payload.data === "object" ? payload.data : payload;
        if (!snapshot || !snapshot.stats || !snapshot.commits || !Array.isArray(snapshot.languages)) {
          return null;
        }

        return snapshot;
      }

      function writeCachedStatsSnapshot(data) {
        try {
          window.localStorage.setItem(
            GITHUB_STATS_CACHE_KEY,
            JSON.stringify({
              timestamp: Date.now(),
              data,
            })
          );
        } catch {
          // Ignore storage failures and keep the snapshot in memory only.
        }
      }

      function parseDateKey(dateKey) {
        const parsed = new Date(`${dateKey}T00:00:00Z`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }

      function formatShortDate(dateKey) {
        const parsed = parseDateKey(dateKey);
        if (!parsed) {
          return "N/A";
        }

        return new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
        }).format(parsed);
      }

      function formatLongDate(value) {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
          return "N/A";
        }

        return new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(parsed);
      }

      function formatDateRange(start, end) {
        if (!start || !end) {
          return "No run yet";
        }

        if (start === end) {
          return formatShortDate(start);
        }

        return `${formatShortDate(start)} - ${formatShortDate(end)}`;
      }

      async function fetchStatsSnapshotPayload() {
        const requestUrl = new URL(STATS_SNAPSHOT_URL);
        requestUrl.searchParams.set("ts", String(Date.now()));

        const response = await fetch(requestUrl.href, {
          cache: "no-store",
          headers: {
            Accept: "application/json, text/plain, */*",
          },
        });

        if (!response.ok) {
          throw new Error("Stats snapshot request failed with status " + response.status);
        }

        return response.json();
      }

      async function loadGitHubStatsSnapshot() {
        const cached = readCachedStatsSnapshot();

        if (githubStatsSnapshotPromise) {
          return githubStatsSnapshotPromise;
        }

        githubStatsSnapshotPromise = fetchStatsSnapshotPayload()
          .then((payload) => {
            const snapshot = parseStatsSnapshotPayload(payload);
            if (!snapshot) {
              throw new Error("Stats snapshot payload is missing required fields.");
            }
            writeCachedStatsSnapshot(snapshot);
            return snapshot;
          })
          .catch((error) => {
            githubStatsSnapshotPromise = null;
            if (cached?.data) {
              return cached.data;
            }

            throw error;
          });

        return githubStatsSnapshotPromise;
      }

      function extractHeroTagline(container) {
        const candidates = Array.from(container.querySelectorAll("p, em"))
          .map((node) => cleanDisplayText(node.textContent))
          .filter(Boolean);

        const exactMatch = candidates.find((text) =>
          normalizeHeading(text).startsWith("every tool here started as a personal itch")
        );

        return exactMatch || HERO_TAGLINE_FALLBACK;
      }

      function isVectorAsset(source) {
        return /\.svg(?:[?#].*)?$/i.test(source) || /^data:image\/svg\+xml/i.test(source);
      }

      const assetImageCache = new Map();
      const projectPaletteCache = new Map();

      function clampChannel(value) {
        return Math.max(0, Math.min(255, Math.round(value)));
      }

      function serializeRgb(rgb) {
        return rgb.map(clampChannel).join(", ");
      }

      function mixRgb(base, tint, amount) {
        return base.map((channel, index) => channel + (tint[index] - channel) * amount);
      }

      function getRgbStats(rgb) {
        const max = Math.max(...rgb);
        const min = Math.min(...rgb);
        return {
          brightness: (rgb[0] + rgb[1] + rgb[2]) / 3,
          saturation: max === 0 ? 0 : (max - min) / max,
        };
      }

      function createProjectPalette(rgb) {
        if (!Array.isArray(rgb) || rgb.length !== 3) {
          return null;
        }

        const stats = getRgbStats(rgb);
        const mutedRgb = mixRgb(rgb, [stats.brightness, stats.brightness, stats.brightness], 0.18);
        const tintStrength = 0.18 + stats.saturation * 0.16;
        const shadowStrength = 0.11 + stats.saturation * 0.12;
        const borderStrength = 0.24 + stats.saturation * 0.18;
        const innerStrength = 0.12 + stats.saturation * 0.16;

        return {
          top: mixRgb([17, 40, 52], mutedRgb, tintStrength),
          bottom: mixRgb([9, 21, 29], mutedRgb, shadowStrength),
          border: mixRgb([36, 74, 91], mutedRgb, borderStrength),
          inner: mixRgb([89, 240, 255], mutedRgb, innerStrength),
        };
      }

      function applyProjectPalette(card, palette) {
        if (!card || !palette) {
          return;
        }

        card.style.setProperty("--project-card-top-rgb", serializeRgb(palette.top));
        card.style.setProperty("--project-card-bottom-rgb", serializeRgb(palette.bottom));
        card.style.setProperty("--project-card-border-rgb", serializeRgb(palette.border));
        card.style.setProperty("--project-card-inner-rgb", serializeRgb(palette.inner));
      }

      async function loadAssetImage(source) {
        if (!source) {
          throw new Error("Missing asset source.");
        }

        if (assetImageCache.has(source)) {
          return assetImageCache.get(source);
        }

        const pending = new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.decoding = "async";
          image.referrerPolicy = "no-referrer";

          image.onload = () => {
            if (typeof image.decode === "function") {
              image.decode().catch(() => {}).finally(() => resolve(image));
              return;
            }

            resolve(image);
          };

          image.onerror = () => {
            assetImageCache.delete(source);
            reject(new Error(`Could not load asset: ${source}`));
          };

          image.src = source;
        });

        assetImageCache.set(source, pending);
        return pending;
      }

      async function extractDominantColor(source, isEmoji = false) {
        if (!source) {
          return null;
        }

        const cacheKey = isEmoji ? "emoji:" + source : source;
        if (projectPaletteCache.has(cacheKey)) {
          return projectPaletteCache.get(cacheKey);
        }

        try {
          const canvas = document.createElement("canvas");
          const sampleSize = 24;
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";

          if (isEmoji) {
            context.font = `${sampleSize * 0.8}px system-ui, -apple-system, sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(source, sampleSize / 2, sampleSize / 2 + 2);
          } else {
            const image = await loadAssetImage(source);
            context.drawImage(image, 0, 0, sampleSize, sampleSize);
          }

          const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
          const totals = [0, 0, 0];
          let weightSum = 0;

          for (let index = 0; index < data.length; index += 4) {
            const alpha = data[index + 3] / 255;
            if (alpha < 0.08) {
              continue;
            }

            const rgb = [data[index], data[index + 1], data[index + 2]];
            const stats = getRgbStats(rgb);
            let weight = alpha * (0.4 + stats.saturation * 0.8);

            if (stats.brightness < 24 || stats.brightness > 236) {
              weight *= 0.55;
            }

            if (weight <= 0.05) {
              continue;
            }

            totals[0] += rgb[0] * weight;
            totals[1] += rgb[1] * weight;
            totals[2] += rgb[2] * weight;
            weightSum += weight;
          }

          const dominant = weightSum
            ? totals.map((value) => value / weightSum)
            : [17, 40, 52];
          const palette = createProjectPalette(dominant);
          projectPaletteCache.set(cacheKey, palette);
          return palette;
        } catch (error) {
          console.warn("Palette extraction failed for project source:", source, error);
          projectPaletteCache.set(cacheKey, null);
          return null;
        }
      }

      async function createHighQualityThumbnail(source, maxSize) {
        const image = await loadAssetImage(source);

        const naturalWidth = image.naturalWidth || maxSize;
        const naturalHeight = image.naturalHeight || maxSize;
        const scale = Math.min(maxSize / naturalWidth, maxSize / naturalHeight, 1);
        const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
        const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext("2d", { alpha: true });
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        function drawIteratively() {
          let currentCanvas = document.createElement("canvas");
          currentCanvas.width = naturalWidth;
          currentCanvas.height = naturalHeight;
          let currentContext = currentCanvas.getContext("2d", { alpha: true });
          currentContext.imageSmoothingEnabled = true;
          currentContext.imageSmoothingQuality = "high";
          currentContext.drawImage(image, 0, 0, naturalWidth, naturalHeight);

          while (currentCanvas.width * 0.5 > targetWidth && currentCanvas.height * 0.5 > targetHeight) {
            const nextCanvas = document.createElement("canvas");
            nextCanvas.width = Math.max(targetWidth, Math.round(currentCanvas.width * 0.5));
            nextCanvas.height = Math.max(targetHeight, Math.round(currentCanvas.height * 0.5));
            const nextContext = nextCanvas.getContext("2d", { alpha: true });
            nextContext.imageSmoothingEnabled = true;
            nextContext.imageSmoothingQuality = "high";
            nextContext.drawImage(
              currentCanvas,
              0,
              0,
              currentCanvas.width,
              currentCanvas.height,
              0,
              0,
              nextCanvas.width,
              nextCanvas.height
            );
            currentCanvas = nextCanvas;
            currentContext = nextContext;
          }

          context.drawImage(
            currentCanvas,
            0,
            0,
            currentCanvas.width,
            currentCanvas.height,
            0,
            0,
            targetWidth,
            targetHeight
          );
        }

        if (typeof createImageBitmap === "function") {
          try {
            const bitmap = await createImageBitmap(image, {
              resizeWidth: targetWidth,
              resizeHeight: targetHeight,
              resizeQuality: "high",
            });
            context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
            if (typeof bitmap.close === "function") {
              bitmap.close();
            }
          } catch (error) {
            drawIteratively();
          }
        } else {
          drawIteratively();
        }

        return canvas.toDataURL("image/png");
      }

      function enhanceProjectIcons(container) {
        const icons = Array.from(container.querySelectorAll("img[data-hires-icon]"));

        for (const icon of icons) {
          const source = icon.dataset.hiresIcon;
          if (!source) {
            continue;
          }

          if (isVectorAsset(source)) {
            icon.src = source;
            continue;
          }

          createHighQualityThumbnail(source, 44)
            .then((thumbnail) => {
              icon.src = thumbnail;
            })
            .catch(() => {
              icon.src = source;
            });
        }
      }

      function tintProjectCards(container) {
        const cards = Array.from(container.querySelectorAll(".project-card[data-icon-source], .project-card[data-emoji-source]"));

        for (const card of cards) {
          const iconSource = card.dataset.iconSource;
          const emojiSource = card.dataset.emojiSource;

          if (!iconSource && !emojiSource) {
            continue;
          }

          extractDominantColor(iconSource || emojiSource, !!emojiSource).then((palette) => {
            applyProjectPalette(card, palette);
          });
        }
      }
      function deriveMonogram(title) {
        const parts = cleanDisplayText(title)
          .replace(/[^a-z0-9 ]/gi, " ")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2);

        return (parts.map((part) => part[0]).join("") || "IP").toUpperCase();
      }

      function prettifyLinkLabel(label) {
        const clean = cleanDisplayText(label);
        if (/open live app/i.test(clean)) {
          return "Live App";
        }
        return clean;
      }

      function collectExtraLinks(cell, primaryLink, title) {
        const entries = new Map();

        for (const anchor of cell.querySelectorAll("a")) {
          const href = anchor.href;
          const label = prettifyLinkLabel(anchor.textContent);
          if (!href || !label || href === primaryLink || label === title) {
            continue;
          }
          entries.set(href, { href, label });
        }

        return Array.from(entries.values());
      }

      function extractTitleAndPrimaryLink(cell) {
        const html = cell.innerHTML;
        const headingLink =
          cell.querySelector("h4 a:last-of-type, h3 a:last-of-type, h5 a:last-of-type") ||
          cell.querySelector("h4 a, h3 a, h5 a");

        let title = cleanDisplayText(
          headingLink?.textContent || cell.querySelector("h4, h3, h5")?.textContent || ""
        );
        let primaryLink = headingLink?.href || cell.querySelector("a")?.href || "";

        if (!title || !primaryLink) {
          const markdownLink = html.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
          if (markdownLink) {
            title = title || cleanDisplayText(markdownLink[1]);
            primaryLink = primaryLink || markdownLink[2];
          }
        }

        return { title, primaryLink };
      }

      function extractTechTags(cell) {
        const tagSet = new Set();

        for (const code of cell.querySelectorAll("code")) {
          const value = cleanDisplayText(code.textContent);
          if (value) {
            tagSet.add(value);
          }
        }

        for (const match of cell.innerHTML.matchAll(/`([^`]+)`/g)) {
          const value = cleanDisplayText(match[1]);
          if (value) {
            tagSet.add(value);
          }
        }

        return Array.from(tagSet);
      }

      function buildProjectDescription(cell, title, techTags, extraLinks) {
        let html = cell.innerHTML;
        html = html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ");
        html = html.replace(/<img[^>]*>/gi, " ");
        html = html.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, " ");
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
        html = html.replace(/`([^`]+)`/g, " ");
        html = html.replace(/\*\*([^*]+)\*\*/g, "$1");
        html = html.replace(/^#{1,6}\s+/gm, "");

        const scratch = document.createElement("div");
        scratch.innerHTML = html;
        let description = cleanDisplayText(scratch.textContent || "");

        if (title) {
          description = description.replace(new RegExp(escapeRegExp(title), "ig"), " ");
        }

        for (const tag of techTags) {
          description = description.replace(new RegExp(escapeRegExp(tag), "ig"), " ");
        }

        for (const link of extraLinks) {
          description = description.replace(new RegExp(escapeRegExp(link.label), "ig"), " ");
        }

        return description
          .replace(/\s+/g, " ")
          .replace(/^[\s.,:;-]+|[\s.,:;-]+$/g, "")
          .trim();
      }

      function parseProjectCard(cell) {
        const { title, primaryLink } = extractTitleAndPrimaryLink(cell);
        if (!title || !primaryLink) {
          return null;
        }

        const techTags = extractTechTags(cell);
        const extraLinks = collectExtraLinks(cell, primaryLink, title);
        const description = buildProjectDescription(cell, title, techTags, extraLinks);
        const icon = cell.querySelector("img")?.src || "";

        return {
          title,
          primaryLink,
          icon,
          description,
          techTags,
          extraLinks,
        };
      }

      function extractProjectCategories(projectNodes) {
        const categories = [];
        let currentCategory = null;

        for (const node of projectNodes) {
          if (node.tagName === "H3") {
            currentCategory = {
              title: cleanDisplayText(node.textContent),
              nodes: [],
            };
            categories.push(currentCategory);
            continue;
          }

          if (!currentCategory || node.tagName === "HR") {
            continue;
          }

          currentCategory.nodes.push(node.cloneNode(true));
        }

        return categories
          .map((category) => {
            const wrapper = assembleNodes(category.nodes);
            const items = Array.from(wrapper.querySelectorAll("td"))
              .map(parseProjectCard)
              .filter(Boolean);

            return {
              title: category.title,
              items,
            };
          })
          .filter((category) => category.items.length);
      }

      function renderProjects(projectNodes) {
        projectsContent.replaceChildren();
        const categories = extractProjectCategories(projectNodes);

        if (!categories.length) {
          projectsContent.appendChild(
            createNode(
              "p",
              "empty-state",
              "No project cards could be parsed from the Featured Projects section."
            )
          );
          return;
        }

        for (const category of categories) {
          const group = createNode("section", "project-group");
          const head = createNode("div", "group-head");
          const groupTitleNode = createNode("h3", "group-title");
          const catTitleText = category.title.trim();
          const catSpaceIdx = catTitleText.indexOf(" ");
          const catFirstPart = catSpaceIdx > -1 ? catTitleText.substring(0, catSpaceIdx) : "";
          
          if (catSpaceIdx > 0 && catSpaceIdx <= 4 && !/^[a-zA-Z0-9_-]+$/.test(catFirstPart)) {
            const emojiSpan = createNode("span", "project-emoji", catFirstPart);
            const textSpan = createNode("span", "project-title-text", catTitleText.substring(catSpaceIdx + 1).trim().toUpperCase());
            groupTitleNode.append(emojiSpan, textSpan);
          } else {
            groupTitleNode.textContent = catTitleText.toUpperCase();
          }

          head.append(
            groupTitleNode,
            createNode("div", "group-line")
          );

          const grid = createNode("div", "project-grid");
          for (const item of category.items) {
            const card = createNode("article", "project-card");
            
            let titleText = item.title.trim();
            let emojiPart = "";
            const spaceIdx = titleText.indexOf(" ");
            const firstPart = spaceIdx > -1 ? titleText.substring(0, spaceIdx) : "";
            
            if (spaceIdx > 0 && spaceIdx <= 4 && !/^[a-zA-Z0-9_-]+$/.test(firstPart)) {
              emojiPart = firstPart;
              titleText = titleText.substring(spaceIdx + 1).trim();
            }

            if (item.icon) {
              card.dataset.iconSource = item.icon;
            } else if (emojiPart) {
              card.dataset.emojiSource = emojiPart;
            }

            const top = createNode("div", "project-top");
            const iconLink = document.createElement("a");
            iconLink.className = "project-icon-shell";
            iconLink.href = item.primaryLink;
            iconLink.target = "_blank";
            iconLink.rel = "noreferrer";
            iconLink.setAttribute("aria-label", item.title);

            if (item.icon) {
              const icon = document.createElement("img");
              icon.src = item.icon;
              icon.dataset.hiresIcon = item.icon;
              icon.alt = "";
              icon.loading = "lazy";
              icon.decoding = "async";
              iconLink.appendChild(icon);
            } else if (emojiPart) {
              const emojiIcon = createNode("span", "project-icon-fallback", emojiPart);
              emojiIcon.style.fontFamily = "system-ui, -apple-system, sans-serif";
              emojiIcon.style.fontSize = "1.6rem";
              iconLink.appendChild(emojiIcon);
            } else {
              iconLink.appendChild(createNode("span", "project-icon-fallback", deriveMonogram(titleText)));
            }

            const meta = createNode("div", "project-meta");
            meta.appendChild(createNode("p", "project-category", category.title));
            const titleHeading = createNode("h4", "project-title");
            
            const titleLink = createLink("", item.primaryLink, "");
            
            if (emojiPart && item.icon) {
              const emojiSpan = createNode("span", "project-emoji", emojiPart);
              const textSpan = createNode("span", "project-title-text", titleText.toUpperCase());
              titleLink.append(emojiSpan, textSpan);
            } else {
              titleLink.textContent = titleText.toUpperCase();
            }
            
            titleHeading.appendChild(titleLink);
            meta.appendChild(titleHeading);
            top.append(iconLink, meta);
            card.appendChild(top);

            if (item.description) {
              card.appendChild(createNode("p", "project-description", item.description));
            }

            if (item.techTags.length) {
              const tags = createNode("ul", "tag-row");
              for (const tag of item.techTags) {
                tags.appendChild(createNode("li", "tag-pill", tag));
              }
              card.appendChild(tags);
            }

            const links = createNode("div", "project-links");
            links.appendChild(createLink("Repository", item.primaryLink, "inline-button"));
            for (const link of item.extraLinks) {
              links.appendChild(createLink(link.label, link.href, "inline-button alt"));
            }
            card.appendChild(links);
            grid.appendChild(card);
          }

          group.append(head, grid);
          projectsContent.appendChild(group);
        }

        enhanceProjectIcons(projectsContent);
        tintProjectCards(projectsContent);
      }

      function renderTechStack(stackNodes) {
        stackContent.replaceChildren();
        const wrapper = assembleNodes(stackNodes);
        const seen = new Set();
        const badges = Array.from(wrapper.querySelectorAll("img"))
          .map((badge) => cleanDisplayText(badge.getAttribute("alt") || badge.getAttribute("aria-label") || ""))
          .filter(Boolean)
          .filter((label) => {
            const token = normalizeToken(label);
            if (!token || seen.has(token)) {
              return false;
            }

            seen.add(token);
            return true;
          });

        if (!badges.length) {
          stackContent.appendChild(
            createNode("p", "empty-state", "No stack badges were found in the Tech Stack section.")
          );
          return;
        }

        for (const label of badges) {
          const token = normalizeToken(label);
          const badge = TECH_STACK_BADGE_MAP[token];
          const tile = createNode("div", "stack-tile");
          const image = document.createElement("img");
          image.alt = badge?.label || label;
          image.loading = "lazy";
          image.decoding = "async";

          if (badge) {
            image.src = withVersionedAsset(TECH_STACK_BADGE_ROOT + badge.path);
          } else {
            image.src =
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="54" viewBox="0 0 210 54" role="img" aria-label="${label}"><rect width="210" height="54" fill="#132632"/><rect x="1.5" y="1.5" width="207" height="51" fill="none" stroke="#244a5b" stroke-width="3"/><text x="105" y="33" fill="#d6e0e7" font-family="Consolas, 'Lucida Console', 'Courier New', monospace" font-size="17" text-anchor="middle">${label}</text></svg>`
              );
          }

          tile.appendChild(image);
          stackContent.appendChild(tile);
        }
      }

      function buildStatsOverviewSvg(snapshot) {
        const rows = [
          { label: "Total Stars:", value: formatStatNumber(snapshot.stats.totalStars) },
          { label: `${snapshot.year} Commits:`, value: formatStatNumber(snapshot.stats.yearCommits) },
          { label: "Total PRs:", value: formatStatNumber(snapshot.stats.totalPrs) },
          { label: "Total Issues:", value: formatStatNumber(snapshot.stats.totalIssues) },
          { label: "Contributed to:", value: formatStatNumber(snapshot.stats.contributedTo) },
        ];
        const iconMarkup = STATS_CARD_ICON_PATHS.map((icon, index) => {
          const offset = (index * 25.2).toFixed(1).replace(/\.0$/, "");
          return `<g transform="translate(0,${offset})" width="14" height="14" fill="#bf91f3"><path fill-rule="${icon.fillRule}" d="${icon.path}"></path></g>`;
        }).join("");
        const labelMarkup = rows
          .map((row, index) => {
            const y = 14 + index * 25.2;
            return `<text x="21" y="${y}" style="fill: #38bdae; font-size: 14px;">${escapeSvgText(row.label)}</text>`;
          })
          .join("");
        const valueMarkup = rows
          .map((row, index) => {
            const y = 14 + index * 25.2;
            return `<text x="130" y="${y}" style="fill: #38bdae; font-size: 14px;">${escapeSvgText(row.value)}</text>`;
          })
          .join("");

        return `
<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200" viewBox="0 0 340 200" role="img" aria-label="GitHub stats overview" style="font-family: 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif;">
  <rect x="1" y="1" rx="5" ry="5" height="99%" width="99.41176470588235%" stroke="#1a1b27" stroke-width="1" fill="#1a1b27" stroke-opacity="1"></rect>
  <text x="30" y="40" style="font-size: 22px; fill: #70a5fd;">Stats</text>
  <g transform="translate(0,40)">
    <g transform="translate(30,20)">
      ${iconMarkup}
      ${labelMarkup}
      ${valueMarkup}
    </g>
    <g transform="translate(220,20)">
      <g transform="scale(6)" style="fill: #bf91f3;">
        <path fill-rule="evenodd" d="${STATS_GITHUB_MARK_PATH}"></path>
      </g>
    </g>
  </g>
</svg>`.trim();
      }

      function buildLanguageCardSvg(snapshot) {
        const languages = snapshot.languages.slice(0, 5);
        const displayLanguages = languages.length
          ? languages
          : [{ name: "Unavailable", count: 1, color: "#3b4f67" }];
        const displayTotal = displayLanguages.reduce((sum, language) => sum + Math.max(language.count, 0), 0) || 1;
        let currentAngle = -90;

        const legendMarkup = displayLanguages
          .map((language, index) => {
            const offset = index * 25.2;
            const labelY = 30 + index * 25.2;
            return `<rect y="${18 + offset}" width="14" height="14" fill="${escapeSvgText(language.color)}" stroke="#1a1b27" style="stroke-width: 1px;"></rect><text x="16.8" y="${labelY}" style="fill: #38bdae; font-size: 14px;">${escapeSvgText(language.name)}</text>`;
          })
          .join("");

        const arcMarkup = displayLanguages
          .map((language, index) => {
            const share =
              index === displayLanguages.length - 1
                ? Math.max(0, (270 - currentAngle) / 360)
                : Math.max(language.count / displayTotal, 0);
            const safeShare = displayLanguages.length === 1 ? 0.999999 : share;
            const startAngle = currentAngle;
            const endAngle = startAngle + safeShare * 360;
            currentAngle = endAngle;
            return `<g class="arc"><path d="${describeDonutSegment(startAngle, endAngle, 60, 35)}" style="fill: ${escapeSvgText(language.color)}; stroke-width: 2px;" stroke="#1a1b27"></path></g>`;
          })
          .join("");

        return `
<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200" viewBox="0 0 340 200" role="img" aria-label="GitHub languages overview" style="font-family: 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif;">
  <rect x="1" y="1" rx="5" ry="5" height="99%" width="99.41176470588235%" stroke="#1a1b27" stroke-width="1" fill="#1a1b27" stroke-opacity="1"></rect>
  <text x="30" y="40" style="font-size: 22px; fill: #70a5fd;">Top Languages by Repo</text>
  <g transform="translate(0,40)">
    <g transform="translate(40,0)">
      ${legendMarkup}
    </g>
    <g transform="translate(230,80)">
      ${arcMarkup}
    </g>
  </g>
</svg>`.trim();
      }

      function buildCommitRunSvg(snapshot) {
        const totalCommits = formatStatNumber(snapshot.commits.total);
        const totalRange = snapshot.commits.since
          ? `${formatLongDate(snapshot.commits.since)} - Present`
          : "All indexed commits";
        const currentRange = formatDateRange(snapshot.commits.current.start, snapshot.commits.current.end);
        const longestRange = formatDateRange(snapshot.commits.longest.start, snapshot.commits.longest.end);
        const streakRingPath = describeOpenCircleArc(247.5, 71, 40, -69, 249);

        return `
<svg xmlns="http://www.w3.org/2000/svg" style="isolation: isolate; font-family: 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif;" viewBox="0 0 495 195" width="495px" height="195px" direction="ltr" role="img" aria-label="GitHub streak overview">
  <g>
    <g style="isolation: isolate">
      <rect stroke="#000000" stroke-opacity="0" fill="#1a1b27" rx="4.5" x="0.5" y="0.5" width="494" height="194"></rect>
    </g>
    <g style="isolation: isolate">
      <line x1="165" y1="28" x2="165" y2="170" vector-effect="non-scaling-stroke" stroke-width="1" stroke="#E4E2E2" stroke-linejoin="miter" stroke-linecap="square" stroke-miterlimit="3"></line>
      <line x1="330" y1="28" x2="330" y2="170" vector-effect="non-scaling-stroke" stroke-width="1" stroke="#E4E2E2" stroke-linejoin="miter" stroke-linecap="square" stroke-miterlimit="3"></line>
    </g>
    <g style="isolation: isolate">
      <g transform="translate(82.5, 48)">
        <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="#70A5FD" stroke="none" font-weight="700" font-size="28px" font-style="normal">${escapeSvgText(totalCommits)}</text>
      </g>
      <g transform="translate(82.5, 84)">
        <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="#70A5FD" stroke="none" font-weight="400" font-size="14px" font-style="normal">Total Contributions</text>
      </g>
      <g transform="translate(82.5, 114)">
        <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="#38BDAE" stroke="none" font-weight="400" font-size="12px" font-style="normal">${escapeSvgText(totalRange)}</text>
      </g>
    </g>
    <g style="isolation: isolate">
      <g transform="translate(247.5, 108)">
        <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="#BF91F3" stroke="none" font-weight="700" font-size="14px" font-style="normal">Current Streak</text>
      </g>
      <g transform="translate(247.5, 145)">
        <text x="0" y="21" stroke-width="0" text-anchor="middle" fill="#38BDAE" stroke="none" font-weight="400" font-size="12px" font-style="normal">${escapeSvgText(currentRange)}</text>
      </g>
      <path d="${streakRingPath}" fill="none" stroke="#70A5FD" stroke-width="5" stroke-linecap="round"></path>
      <g transform="translate(247.5, 19.5)" stroke-opacity="0">
        <path d="M -12 -0.5 L 15 -0.5 L 15 23.5 L -12 23.5 L -12 -0.5 Z" fill="none"></path>
        <path d="${STREAK_FIRE_PATH}" fill="#70A5FD" stroke-opacity="0"></path>
      </g>
      <g transform="translate(247.5, 48)">
        <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="#BF91F3" stroke="none" font-weight="700" font-size="28px" font-style="normal">${escapeSvgText(snapshot.commits.current.length)}</text>
      </g>
    </g>
    <g style="isolation: isolate">
      <g transform="translate(412.5, 48)">
        <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="#70A5FD" stroke="none" font-weight="700" font-size="28px" font-style="normal">${escapeSvgText(snapshot.commits.longest.length)}</text>
      </g>
      <g transform="translate(412.5, 84)">
        <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="#70A5FD" stroke="none" font-weight="400" font-size="14px" font-style="normal">Longest Streak</text>
      </g>
      <g transform="translate(412.5, 114)">
        <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="#38BDAE" stroke="none" font-weight="400" font-size="12px" font-style="normal">${escapeSvgText(longestRange)}</text>
      </g>
    </g>
  </g>
</svg>`.trim();
      }

      function renderStatsFallback() {
        statsContent.replaceChildren();
        const frame = createNode("article", "stat-card stat-card-wide");
        frame.appendChild(
          createNode(
            "p",
            "empty-state",
            "The stats cabinet is waiting for GitHub to respond. Featured projects and stack are still available."
          )
        );
        statsContent.appendChild(frame);
      }

      async function renderStats() {
        statsContent.replaceChildren();

        try {
          const snapshot = await loadGitHubStatsSnapshot();
          statsContent.append(
            createStatsSvgCard(buildStatsOverviewSvg(snapshot), false),
            createStatsSvgCard(buildLanguageCardSvg(snapshot), false),
            createStatsSvgCard(buildCommitRunSvg(snapshot), true)
          );
        } catch (error) {
          console.warn("GitHub stats snapshot failed to load.", error);
          renderStatsFallback();
        }
      }

      function updateStatus(state, heading, detail, isError) {
        statusMeter.dataset.state = state;
        heroStatus.textContent = heading;
        heroStatusDetail.textContent = detail;

        if (!isError) {
          return;
        }

        statusPanel.hidden = false;
        statusPanel.innerHTML = "";
        const title = createNode("h2", "panel-heading", heading);
        const copy = createNode("p", "panel-copy");
        copy.append(
          document.createTextNode(detail + " Open the profile directly at "),
          createLink("github.com/mantukin", "https://github.com/mantukin", ""),
          document.createTextNode(".")
        );
        statusPanel.append(title, copy);
      }

      function signalProfileContentReady() {
        if (!document.body || document.body.dataset.profileReady === "true") {
          return;
        }

        document.body.dataset.profileReady = "true";
        window.dispatchEvent(new Event("profile-content-ready"));
      }

      function signalAppShellReady() {
        if (!document.body || document.body.dataset.appShellReady === "true") {
          return;
        }

        document.body.dataset.appShellReady = "true";
        window.dispatchEvent(new Event("app-shell-ready"));
      }

      async function loadProfileReadme() {
        updateStatus(
          "loading",
          "Loading",
          "Fetching Featured Projects, Tech Stack, and GitHub Stats.",
          false
        );

        try {
          const response = await fetch(README_URL, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`GitHub returned ${response.status}`);
          }

          const markdown = await response.text();
          const parsed = document.createElement("div");
          parsed.innerHTML = marked.parse(markdown, {
            gfm: true,
            breaks: false,
          });

          rewriteRelativeAssets(parsed);
          const featuredProjects = collectSectionNodes(parsed, "featured projects");
          const techStack = collectSectionNodes(parsed, "tech stack");
          const workshopTagline = extractHeroTagline(parsed);

          if (!featuredProjects.length || !techStack.length) {
            throw new Error("One or more curated README sections could not be found.");
          }

          heroDescription.textContent = workshopTagline;
          renderProjects(featuredProjects);
          renderTechStack(techStack);
          await renderStats();

          contentShell.hidden = false;
          statusPanel.hidden = true;
          updateStatus(
            "ready",
            "Ready",
            "Featured projects and stack are synced from the latest profile README.",
            false
          );
          signalProfileContentReady();
          signalAppShellReady();
        } catch (error) {
          console.error(error);
          contentShell.hidden = true;
          heroDescription.textContent = HERO_TAGLINE_FALLBACK;
          updateStatus(
            "error",
            "Sync failed",
            "The arcade cabinet could not load the profile sections right now.",
            true
          );
          signalProfileContentReady();
          signalAppShellReady();
        }
      }

      loadProfileAvatar();
      loadProfileReadme();
    
