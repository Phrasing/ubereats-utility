const puppeteer = require("puppeteer-extra");

const { autoScroll, getRandomInt } = require("./puppeteer_utility.js");

/*

 - Create a json with format like this.
 {
    item_url: "Link to the ubereats item page.",
    steps: [
        {
            label: "Name of the item", // Optional, this is just for logging purposes.
            item_xpath: "Xpath to the item", // Xpath to the item. This is the item that will be clicked. Retrieve this from the ubereats item page.
            quantity: 1, // How many times to click the item.
            opens_frame: false, // If the item opens a frame, set this to true. If when you click the item, a frame opens, set this to true. 
            frame_actions: [ // If opens_frame is true, then this is required. This is the actions that will be taken inside the frame.
                {
                    label: "Name of the item", 
                    xpath: "Xpath to the item",
                    expands: false, // If the item expands, set this to true.
                    expanded_actions: [ // If expands is true, then this is required. This is the actions that will be taken inside the expanded item. 

                    ] 
                }
            ] 
        }
    ],
 }

*/

async function checkoutOrder(eatsPage) {
  //await eatsPage.waitForTimeout(30000);
  await eatsPage.goto("https://www.ubereats.com/checkout", {
    waitUntil: "networkidle2",
  });

  try {
    await Promise.race([
      eatsPage.waitForXPath(
        '//*[@id="main-content"]/div/div[3]/div[2]/div[1]/div[2]/div[3]/div[2]/a/button',
        {
          timeout: 6000,
        }
      ),
      eatsPage.waitForXPath(
        '//*[@id="main-content"]/div/div[3]/div[2]/div[2]/div[2]/div[3]/div[2]/a/button',
        {
          timeout: 6000,
        }
      ),
    ]).then(async (button) => {
      await eatsPage.waitForTimeout(1000);
      await button.click();
    });
  } catch (error) {
    console.log(error);
  }

  await eatsPage.waitForTimeout(5000);
  const promoCodeInput = await eatsPage.waitForXPath(
    '//*[@id="wrapper"]/div[3]/div/div/div[2]/div[3]/div[2]/form/div/div[1]/div/div[2]/input',
    { timeout: 6000 }
  );

  await promoCodeInput.focus();
  await eatsPage.keyboard.type("eats-nickc40116ue", {
    delay: getRandomInt(50, 100),
  });

  const applyPromoBtn = await eatsPage.waitForXPath(
    '//*[@id="wrapper"]/div[3]/div/div/div[2]/div[3]/div[2]/form/div/button',
    { timeout: 6000 }
  );
  await applyPromoBtn.click();

  await eatsPage.waitForTimeout(5000);

  await eatsPage.goto("https://www.ubereats.com/checkout", {
    waitUntil: "networkidle2",
  });

  await eatsPage.waitForTimeout(2500);

  try {
    await Promise.race([
      eatsPage.waitForXPath(
        '//*[@id="main-content"]/div/div[3]/div[2]/div[1]/div[2]/div[1]/div/div[2]/a/button',
        {
          timeout: 6000,
        }
      ),
    ]).then(async (button) => {
      await eatsPage.waitForTimeout(1000);
      await button.click();
    });
  } catch (error) {
    console.log(error);
  }

  await eatsPage.waitForTimeout(2500);

  try {
    const elements = await eatsPage.$x(
      '//*[@id="wrapper"]/div[3]/div/div/div[2]/div[3]/div[3]/div/select'
    );
    await elements[0].select("leave_at_door");

    const saveBtn = await eatsPage.waitForXPath(
      '//*[@id="wrapper"]/div[3]/div/div/div[2]/div[3]/button',
      { timeout: 6000 }
    );
    await saveBtn.click();
  } catch (error) {
    console.log(error);
  }
  await eatsPage.waitForTimeout(3500);

  try {
    await Promise.race([
      eatsPage.waitForXPath(
        '//*[@id="main-content"]/div/div[3]/div[2]/div[2]/div/div[1]/div/button',
        {
          timeout: 6000,
        }
      ),
      eatsPage.waitForXPath(
        '//*[@id="main-content"]/div/div[3]/div[2]/div[2]/div[5]/div/div[2]/button',
        {
          timeout: 6000,
        }
      ),
    ]).then(async (button) => {
      await eatsPage.waitForTimeout(1000);
      await button.click();
    });
  } catch (error) {
    console.log(error);
  }
}

async function createOrder(eatsPage) {
  const json = {
    item_url:
      "https://www.ubereats.com/store/panda-express-5234-east-highway-100/lmm4YkPwSayAsGRIwjBsYQ/4db7f68d-7eb3-5220-a2dc-8a0d4a37cbd6/00770077-a15f-5df7-9870-ce80455e8740/8a8ff7b8-344b-5343-be88-948794c49705",
    steps: [
      {
        label: "White Steamed Rice",
        item_xpath:
          '//*[@id="main-content"]/div/div[1]/div/div[2]/ul/li[1]/div/div[2]/div[3]/div[1]/button',
        quantity: 1,
      },
      {
        label: "Super Greens",
        item_xpath:
          '//*[@id="main-content"]/div/div[1]/div/div[2]/ul/li[1]/div/div[2]/div[4]/div[1]/button',
        quantity: 1,
      },
      {
        label: "Grilled Teriyaki Chicken",
        item_xpath:
          '//*[@id="main-content"]/div/div[1]/div/div[2]/ul/li[2]/div/div[2]/div[4]/div[1]/button',
        quantity: 3,
      },
    ],
    quantity: 2,
  };

  try {
    await eatsPage.goto(json.item_url, { waitUntil: "networkidle2" });

    for (let i = 0; i < json.steps.length; i++) {
      const step = json.steps[i];

      const item = await eatsPage.waitForXPath(step.item_xpath, {
        timeout: 6000,
      });

      for (let i = 0; i < step.quantity; i++) {
        await item.click();
        console.log("clicked item");
        if (step.opens_frame) {
          await eatsPage.waitForTimeout(1000);
          for (let ii = 0; ii < step.frame_actions.length; ii++) {
            const frameAction = step.frame_actions[ii];
            const frameItem = await eatsPage.waitForXPath(frameAction.xpath, {
              timeout: 6000,
            });
            await frameItem.click();
            await eatsPage.waitForTimeout(1000);
            console.log("Clicked frame item.");
            if (frameAction.expands) {
              for (
                let iii = 0;
                iii < frameAction.expanded_actions.length;
                iii++
              ) {
                const expandedAction = frameAction.expanded_actions[iii];
                const expandedItem = await eatsPage.waitForXPath(
                  expandedAction.xpath,
                  {
                    timeout: 6000,
                  }
                );
                await expandedItem.click();
                await eatsPage.waitForTimeout(1000);
                console.log("Clicked expanded item.");
              }
            }
          }
          const saveBtn = await eatsPage.waitForXPath(
            '//*[@id="main-content"]/div/div[5]/div/div/div[2]/div/div[2]/button',
            { timeout: 6000 }
          );
          await saveBtn.click();
        }
      }
    }

    await autoScroll(eatsPage);

    try {
      const elements = await eatsPage.$x(
        '//*[@id="main-content"]/div/div[1]/div/div[2]/div[3]/div/div[1]/div/div/select'
      );
      await elements[0].select(json.quantity + "00000");
    } catch (error) {
      console.log(error);
    }

    await eatsPage.waitForTimeout(1000);

    const addToOrderBtn = await eatsPage.waitForXPath(
      '//*[@id="main-content"]/div/div[1]/div/div[2]/div[3]/div/button',
      { timeout: 6000 }
    );

    await addToOrderBtn.click();
    await eatsPage.waitForTimeout(5000);
  } catch (error) {
    console.log(error);
  }
}

module.exports = { createOrder, checkoutOrder };
