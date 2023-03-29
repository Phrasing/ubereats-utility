const puppeteer = require("puppeteer-extra");

async function extractTextFromSelector(page, selector, timeout = 5000) {
  await page.waitForSelector(selector);
  return await page.$eval(selector, (el) => el.textContent);
}

module.exports = { extractTextFromSelector };
