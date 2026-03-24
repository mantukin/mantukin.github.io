      const README_URL = "https://raw.githubusercontent.com/mantukin/mantukin/main/README.md";
      const REPO_RAW_ROOT = "https://raw.githubusercontent.com/mantukin/mantukin/main/";
      const REPO_BLOB_ROOT = "https://github.com/mantukin/mantukin/blob/main/";
      const GITHUB_USER = "mantukin";
      const GITHUB_PROFILE_URL = "https://github.com/" + GITHUB_USER;
      const GITHUB_USER_API_URL = "https://api.github.com/users/" + GITHUB_USER;
      const GITHUB_AVATAR_FALLBACK_URL = GITHUB_PROFILE_URL + ".png?size=160";
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
      const GITHUB_STATS_WIDGETS = [
        {
          alt: "GitHub Stats",
          src: "https://github-profile-summary-cards.vercel.app/api/cards/stats?username=mantukin&theme=tokyonight",
        },
        {
          alt: "Top Languages",
          src: "https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=mantukin&theme=tokyonight",
        },
        {
          alt: "GitHub Streak",
          src: "https://streak-stats.demolab.com/?user=mantukin&theme=tokyonight&hide_border=true&background=1a1b27",
          wide: true,
        },
      ];

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

      function withWidgetVersion(source) {
        try {
          const url = new URL(source, window.location.href);
          const version = window.__ASSET_VERSION__ || String(Date.now());
          url.searchParams.set("v", version);
          return url.href;
        } catch {
          return source;
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

      function warmWidgetCache(widgetUrls) {
        if (!("serviceWorker" in navigator) || !Array.isArray(widgetUrls) || !widgetUrls.length) {
          return;
        }

        navigator.serviceWorker.ready
          .then((registration) => {
            const worker =
              navigator.serviceWorker.controller ||
              registration.active ||
              registration.waiting ||
              registration.installing;

            if (!worker) {
              return;
            }

            worker.postMessage({
              type: "warm-widget-cache",
              urls: widgetUrls,
            });
          })
          .catch(() => {});
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

      function renderStats() {
        statsContent.replaceChildren();
        if (!GITHUB_STATS_WIDGETS.length) {
          statsContent.appendChild(
            createNode("p", "empty-state", "No stat cards are configured for the GitHub Stats section.")
          );
          return;
        }

        for (const widget of GITHUB_STATS_WIDGETS) {
          const frame = createNode("div", "stat-card");
          if (widget.wide) {
            frame.classList.add("stat-card-wide");
          }

          const media = document.createElement("img");
          media.src = withWidgetVersion(widget.src);
          media.alt = widget.alt;
          media.loading = "eager";
          media.decoding = "async";
          media.referrerPolicy = "no-referrer";
          frame.appendChild(media);
          statsContent.appendChild(frame);
        }

        warmWidgetCache(GITHUB_STATS_WIDGETS.map((widget) => withWidgetVersion(widget.src)));
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
          renderStats();

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
    
