const puppeteer = require("puppeteer-extra");
const os = require("os");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { randomInt } = require("crypto");
const { cwd } = require("process");
const path = require("node:path");
const fs = require("fs");

const { initializeImap, checkForUberCode } = require("./imapclient.js");
const {
  extractTextFromSelector,
  autoScroll,
  getRandomInt,
} = require("./puppeteer_utility.js");

function getEnoExtension() {
  return "C:\\Users\\Mark\\Documents\\4.1.3\\4.1.3";
}

function getEnoExtensionProfile() {
  return os.tmpdir() + "\\eno_extension_profile";
}

async function lockEnoVirtualCard(config) {
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

  const page = await browser.newPage();

  await page.goto("https://www.ubereats.com", {
    waitUntil: "networkidle0",
  });

  await page.waitForSelector("#cap-one-ext-container", { timeout: 10000 });

  await page.waitForTimeout(2500);

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

  const selectButton = await enoFrame.waitForSelector(
    "#routerOutletContainer > app-home > div > div > div:nth-child(1) > img",
    { timeout: 6000 }
  );
  await selectButton.click();

  await enoFrame.waitForSelector("#toggle-switch", { timeout: 6000 });
  await enoFrame.$eval("#toggle-switch", (el) => el.click());

  await page.waitForTimeout(2500);
  await page.close();
  await browser.close();
}

async function generateEnoVirtualCard(config) {
  const browser = await puppeteer.launch({
    headless: false,
    ignoreDefaultArgs: true,
    args: [
      "--user-data-dir=" + getEnoExtensionProfile(),
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      "--load-extension=" + getEnoExtension(),
      "--extensions-on-chrome-urls",
      "--disable-extensions-except=" + getEnoExtension(),
    ],
  });

  const page = await browser.newPage();

  await page.goto("https://www.ubereats.com", {
    waitUntil: "networkidle0",
  });

  await page.waitForSelector("#cap-one-ext-container", { timeout: 10000 });

  await page.waitForTimeout(3500);

  const frames = page.frames();

  const enoFrame = frames.find((frame) =>
    frame.url().includes("clmkdohmabikagpnhjmgacbclihgmdje/#/")
  );

  try {
    const signInButton = await enoFrame.waitForSelector("#c1-login-button", {
      timeout: 3000,
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

    await page.waitForTimeout(500);
    await passwordInput.focus();
    await page.keyboard.type(config.enoLogin.password, {
      delay: getRandomInt(50, 100),
    });

    await signInButton.click();
  } catch (err) {
    console.log(err);
  }

  try {
    const createButton = await enoFrame.waitForSelector(
      "#routerOutletContainer > app-home > div > div > div:nth-child(1) > img",
      {
        timeout: 6000000,
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

    const cardNumber = await extractTextFromSelector(
      enoFrame,
      cardNumberSelector
    );
    const cardCvv = await extractTextFromSelector(enoFrame, cardCvvSelector);
    const cardExp = await extractTextFromSelector(enoFrame, cardExpSelector);

    console.log("Card Number: " + cardNumber);
    console.log("Card CVV: " + cardCvv);
    console.log("Card Exp: " + cardExp);

    await page.close();
    await browser.close();

    return { cardNumber: cardNumber, cardCvv: cardCvv, cardExp: cardExp };
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function createAccount(imapClient, eatsPage, config, enoVirtualCard) {
  const signUpButton = await eatsPage.waitForXPath(
    '//*[@id="wrapper"]/header/div/div/div/div/a[3]',
    { timeout: 6000 }
  );

  await signUpButton.click();

  await eatsPage.waitForNavigation({
    waitUntil: "networkidle0",
  });

  const emailAddress = await eatsPage.waitForSelector(
    "#PHONE_NUMBER_or_EMAIL_ADDRESS",
    { timeout: 10000 }
  );

  await emailAddress.focus();

  const eatsEmailAddress = "eats" + randomInt(100, 1000) + config.catchAll;

  await eatsPage.keyboard.type(eatsEmailAddress, {
    delay: getRandomInt(50, 100),
  });

  await eatsPage.click("#forward-button");
  await eatsPage.waitForTimeout(2500);

  var code = null;
  while (code == null) {
    code = await checkForUberCode(eatsEmailAddress, imapClient);
    await eatsPage.waitForTimeout(2500);
  }
  console.log(code);

  for (let i = 0; i < code.length; i++) {
    console.log("#EMAIL_OTP_CODE-" + i);
    const otpCode = await eatsPage.waitForSelector("#EMAIL_OTP_CODE-" + i, {
      timeout: 5000,
    });
    await otpCode.focus();
    await eatsPage.keyboard.type(code[i], { delay: getRandomInt(50, 100) });
  }

  await eatsPage.click("#forward-button");
  await eatsPage.waitForTimeout(2500);

  const phoneNumber = await eatsPage.waitForSelector("#PHONE_NUMBER", {
    timeout: 5000,
  });

  await phoneNumber.focus();

  await eatsPage.keyboard.type("386892" + getRandomInt(1000, 9000), {
    delay: getRandomInt(50, 100),
  });

  await eatsPage.click("#forward-button");
  await eatsPage.waitForTimeout(2500);

  var phoneNumberUsed = true;
  try {
    await eatsPage.waitForSelector("#account-update-notme", { timeout: 2500 });
  } catch (err) {
    console.log("Phone number not used. Continuing...");
    phoneNumberUsed = false;
  }

  if (phoneNumberUsed) {
    // Click button "not me" to continue.
    await handleUberEats(imapClient, config, enoVirtualCard);
    return;
  }

  const firstNameInput = await eatsPage.waitForSelector("#FIRST_NAME", {
    timeout: 6000,
  });
  const lastNameInput = await eatsPage.waitForSelector("#LAST_NAME", {
    timeout: 6000,
  });

  await firstNameInput.focus();

  await eatsPage.keyboard.type(config.uberFirstName, {
    delay: getRandomInt(50, 100),
  });

  await lastNameInput.focus();

  await eatsPage.keyboard.type("Meonityl", {
    delay: getRandomInt(50, 100),
  });

  await eatsPage.click("#forward-button");
  await eatsPage.waitForTimeout(2500);

  await eatsPage.waitForXPath(
    "//label[@data-baseweb='checkbox']//div//p[text()='I Agree']//..//..//input",
    {
      timeout: 6000,
    }
  );

  const elements = await eatsPage.$x(
    "//label[@data-baseweb='checkbox']//div//p[text()='I Agree']//..//..//input"
  );

  await elements[0].evaluate((b) => b.click());

  await eatsPage.click("#forward-button");
  await eatsPage.waitForNavigation();
}

async function setDeliveryAddress(eatsPage, config) {
  const deliveryAddressInput = await eatsPage.waitForXPath(
    '//*[@id="location-typeahead-home-input"]',
    { timeout: 8000 }
  );
  await deliveryAddressInput.focus();

  await eatsPage.keyboard.type(config.deliveryAddress, {
    delay: getRandomInt(50, 100),
  });

  try {
    await Promise.race([
      eatsPage.waitForXPath(
        '//*[@id="main-content"]/div[1]/div[2]/div/div[1]/button',
        {
          timeout: 6000,
        }
      ),
      eatsPage.waitForXPath(
        '//*[@id="main-content"]/div[1]/div[2]/div/div/button',
        {
          timeout: 6000,
        }
      ),
    ]).then(async (button) => {
      await eatsPage.waitForTimeout(2500);
      await button.click();
    });
  } catch (error) {
    console.log(error);
  }
  await eatsPage.waitForTimeout(2500);
}

async function addPaymentMethod(eatsPage, config, enoVirtualCard) {
  await eatsPage.goto("https://wallet.uber.com/payment-profile/add", {
    waitUntil: "networkidle0",
  });

  const frames = eatsPage.frames();

  const walletFrame = frames.find((frame) =>
    frame.url().includes("https://payments.uber.com/add")
  );

  const addCreditOrDebitButton = await walletFrame.waitForXPath(
    '//*[@id="root"]/div[1]/div/div/div/li[1]/div[2]',
    { timeout: 7000 }
  );

  await addCreditOrDebitButton.click();

  const cardNumberInput = await walletFrame.waitForSelector("#card-number", {
    timeout: 5000,
  });
  await cardNumberInput.focus();

  await eatsPage.keyboard.type(enoVirtualCard.cardNumber, {
    delay: getRandomInt(50, 100),
  });

  const cardExpInput = await walletFrame.waitForSelector("#card-expiration", {
    timeout: 5000,
  });
  await cardExpInput.focus();

  await eatsPage.keyboard.type(enoVirtualCard.cardExp, {
    delay: getRandomInt(50, 100),
  });

  const cardCodeInput = await walletFrame.waitForSelector("#card-code", {
    timeout: 5000,
  });
  cardCodeInput.focus();

  await eatsPage.keyboard.type(enoVirtualCard.cardCvv, {
    delay: getRandomInt(50, 100),
  });

  const cardBillingZipInput = await walletFrame.waitForSelector(
    "#billing-zip",
    {
      timeout: 5000,
    }
  );
  cardBillingZipInput.focus();

  await eatsPage.keyboard.type(config.billingZip, {
    delay: getRandomInt(50, 100),
  });

  const addCardButton = await walletFrame.waitForXPath(
    '//*[@id="root"]/div[1]/div/div/div/div[3]/button[1]',
    {
      timeout: 5000,
    }
  );
  addCardButton.click();
}

async function joinUberOne(eatsPage) {
  await eatsPage.goto(
    "https://www.ubereats.com/eats-pass?access-point=BILLBOARD&entry-point=upsell_billboard&mod=purchaseMembership",
    {
      waitUntil: "networkidle0",
    }
  );

  const tryForFreeBtn = await eatsPage.waitForXPath(
    '//*[@id="wrapper"]/div[3]/div/div/div[2]/div[4]/div[4]/div[2]/button',
    { timeout: 6000 }
  );

  await tryForFreeBtn.click();
}

async function handleUberEats(imapClient, config, enoVirtualCard) {
  const eatsBrowser = await puppeteer.launch({
    headless: false,
    ignoreDefaultArgs: true,
    executablePath:
      "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    args: [
      "--user-data-dir=" + getEnoExtensionProfile() + randomInt(100, 99999),
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      "--extensions-on-chrome-urls",
    ],
  });

  await createAccount(imapClient, eatsBrowser, config, enoVirtualCard);

  const eatsPage = await eatsBrowser.newPage();
  await eatsPage.goto("https://www.ubereats.com", {
    waitUntil: "networkidle0",
  });

  await setDeliveryAddress(eatsPage, config);
  await addPaymentMethod(eatsPage, config, enoVirtualCard);

  await eatsPage.waitForTimeout(5000);

  await joinUberOne(eatsPage);

  await eatsPage.waitForTimeout(3500);

  await eatsPage.goto("https://www.ubereats.com/feed?diningMode=DELIVERY", {
    waitUntil: "networkidle0",
  });
}

function loadConfig(configPath) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return config;
  } catch (error) {
    console.log(error);
  }
  return null;
}

function createTemplateConfig(configPath) {
  const config = {
    enoIndex: 0,
    enoLogin: { username: "user123", password: "password123" },
    imapCredentials: {
      host: "imap.gmail.com",
      port: 993,
      useTLS: true,
      emailAddress: "your_gmail_address@gmail.com",
      appPassword: "gmail_app_password",
    },
    catchAll: "@yourcatchall.com",
    uberFirstName: "John",
    billingZip: "eno_billing_zip",
    deliveryAddress: "your_address",
  };
  const rawJson = JSON.stringify(config, null, 2);
  fs.writefileSync(configPath, rawJson, "utf8");
}

(async () => {
  const configPath = path.join(cwd(), "config.json");
  const config = loadConfig(configPath);

  if (config == null) {
    console.log("Template config file created. Please fill in the details.");
    createTemplateConfig(configPath);
    return;
  }

  const imapClient = initializeImap({
    user: config.imapCredentials.emailAddress,
    password: config.imapCredentials.appPassword,
    host: config.imapCredentials.host,
    port: config.imapCredentials.port,
    tls: config.imapCredentials.useTLS,
    tlsOptions: {
      rejectUnauthorized: false,
    },
  });

  puppeteer.use(StealthPlugin());

  const enoVirtualCard = await generateEnoVirtualCard(config);
  if (enoVirtualCard == null) {
    console.log("Error generating Eno Virtual Card");
    return;
  }

  await handleUberEats(imapClient, config, enoVirtualCard);

  await eatsPage.waitForTimeout(2500000);
})();
