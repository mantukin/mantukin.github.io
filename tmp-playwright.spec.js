const { test } = require('@playwright/test');

test('inspect stats cards', async ({ page }) => {
  const failures = [];
  page.on('requestfailed', req => failures.push({ url: req.url(), error: req.failure() && req.failure().errorText }));
  await page.goto('https://mantukin.github.io/', { waitUntil: 'networkidle', timeout: 60000 });
  const cards = await page.$$eval('#stats-content .stat-card', cards => cards.map((card, index) => ({
    index,
    text: card.innerText.trim(),
    html: card.innerHTML,
    imgs: Array.from(card.querySelectorAll('img')).map(img => ({
      alt: img.alt,
      src: img.getAttribute('src'),
      currentSrc: img.currentSrc,
      complete: img.complete,
      width: img.naturalWidth,
      height: img.naturalHeight
    })),
    pictureSources: Array.from(card.querySelectorAll('picture source')).map(s => ({ media: s.media, srcset: s.srcset }))
  })));
  console.log(JSON.stringify({ cards, failures }, null, 2));
});
