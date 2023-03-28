const puppeteer = require("puppeteer-extra");
const os = require("os");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { sign, randomInt } = require("crypto");

function getEnoExtension() {
  return "C:\\Users\\Mark\\Documents\\4.1.3\\4.1.3";
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getEnoExtensionProfile() {
  return os.tmpdir() + "\\eno_extension_profile";
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

async function extractTextFromSelector(page, selector, timeout = 5000) {
  await page.waitForSelector(selector);
  return await page.$eval(selector, el => el.textContent);
}

(async () => {
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless: false,
    ignoreDefaultArgs: true,
    args: [
      "--user-data-dir=" + getEnoExtensionProfile() + 78,
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      "--load-extension=" + getEnoExtension(),
      "--extensions-on-chrome-urls",
      "--disable-extensions-except=" + getEnoExtension(),
    ],
  });

  const config = {
    enoIndex: 2,
    enoLogin: { username: "user", password: "1234" },
  };

  const page = await browser.newPage();

  await page.goto("https://www.ubereats.com");

  await page.waitForSelector("#cap-one-ext-container", { timeout: 10000 });

  await page.waitForTimeout(3500);

  const frames = page.frames();

  const enoFrame = frames.find((frame) =>
    frame.url().includes("clmkdohmabikagpnhjmgacbclihgmdje/#/")
  );

  try {
    const signInButton = await enoFrame.waitForSelector("#c1-login-button", {
      timeout: 6000,
    });

    const usernameInput = await enoFrame.waitForSelector("#c1-username", {
      timeout: 6000,
    });

    const passwordInput = await enoFrame.waitForSelector("#c1-password", {
      timeout: 6000,
    });

    await usernameInput.focus();

    await page.keyboard.type(config.enoLogin.username, {
      delay: getRandomInt(50, 100),
    });

    await page.waitForTimeout(3000);
    await passwordInput.focus();
    await page.keyboard.type(config.enoLogin.password, {
      delay: getRandomInt(50, 100),
    });

    await signInButton.click();
  } catch (err) {
    console.log("Error: " + err);
  }

  try {
    const createButton = await enoFrame.waitForSelector(
      "#routerOutletContainer > app-home > div > div > div:nth-child(1) > img",
      {
        timeout: 35 * 1000,
      }
    );
    await createButton.click();

    await autoScroll(enoFrame);
    const getNewCard = await enoFrame.waitForSelector(
      "#select-card-container > div.card-list-container.standard-view > div.delete-card-subtext > div > a",
      { timeout: 10000 }
    );
    await getNewCard.click();

    const selectCard = await enoFrame.waitForSelector(
      "#setupVNcard" + config.enoIndex,
      {
        timeout: 6000,
      }
    );
    await selectCard.click();

    const generateVCC = await enoFrame.waitForSelector("#c1-login-button", {
      timeout: 6000,
    });
    await generateVCC.click();

    const cardNumberSelector =
      "#routerOutletContainer > app-detail-virtual-card > div.select-card-container > div > app-virtual-card > div > div.card-number.card-data.ng-star-inserted";
    const cardCvvSelector =
      "#routerOutletContainer > app-detail-virtual-card > div.select-card-container > div > app-virtual-card > div > div.card-cvv.card-data.ng-star-inserted";
    const cardExpSelector =
      "#routerOutletContainer > app-detail-virtual-card > div.select-card-container > div > app-virtual-card > div > div.card-exp.card-data.ng-star-inserted";

    const cardNumber = await extractTextFromSelector(enoFrame, cardNumberSelector);
    const cardCvv = await extractTextFromSelector(enoFrame, cardCvvSelector);
    const cardExp = await extractTextFromSelector(enoFrame, cardExpSelector);

    console.log("Card Number: " + cardNumber);
    console.log("Card CVV: " + cardCvv);
    console.log("Card Exp: " + cardExp);

  } catch (err) {
    console.log(err);
  }

  await page.close()
  await browser.close();

  const eatsBrowser = await puppeteer.launch({
    headless: false,
    ignoreDefaultArgs: true,
    args: [
      "--user-data-dir=" + getEnoExtensionProfile() + randomInt(1000, 9999),
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      "--extensions-on-chrome-urls"
    ],
  });
  const eatsPage = await eatsBrowser.newPage();
  await eatsPage.goto("https://www.ubereats.com");

  await eatsPage.waitForTimeout(2500000);
})();
