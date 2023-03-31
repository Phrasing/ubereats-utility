const puppeteer = require("puppeteer-extra");

async function extractTextFromSelector(page, selector, timeout = 5000) {
  await page.waitForSelector(selector);
  return await page.$eval(selector, (el) => el.textContent);
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { extractTextFromSelector, autoScroll, getRandomInt };
