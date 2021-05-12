const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");

const solveLoginCaptcha = require("./solveLoginCaptcha");

function rdn(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const verifyLoginCredentials = async (email, password) => {
  puppeteer.use(pluginStealth());

  const browserFetcher = puppeteer.createBrowserFetcher();

  const revisionInfo = await browserFetcher.download("809590.");

  const browser = await puppeteer.launch({
    executablePath: revisionInfo.executablePath,
    // executablePath: "/usr/bin/chromium-browser",
    headless: false,
    args: [
      "--window-size=1920,1080",
      "--window-position=000,000",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=site-per-process",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
      "--disable-setuid-sandbox",
      "--disable-infobars",
    ],
  });
  try {
    const page = await browser.newPage();
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(
      "https://www.goodlifefitness.com/book-workout.html#no-redirect",
      ["geolocation"]
    );
    await page.setBypassCSP(true);
    await page.setDefaultNavigationTimeout(0);
    // page.goto("https://www.google.com/recaptcha/api2/demo");

    await page.goto(
      "https://www.goodlifefitness.com/book-workout.html#no-redirect"
    );
    await page.click(".c-header__login", { delay: rdn(2000, 4000) });

    await page.waitForTimeout(rdn(1000, 2000));

    await solveLoginCaptcha(page);

    // LOGIN SEQUENCE
    //--------------------------------------------------------------------------------
    // Enter Email
    await page.waitForTimeout(rdn(500, 1000));
    await page.type(".c-field__input.js-login-email", email, {
      delay: rdn(30, 75),
    });
    // Enter Password
    await page.type(".c-field__input.js-login-password", password, {
      delay: rdn(30, 75),
    });
    // Hit Login Button
    await page.click(".js-login-submit", { delay: rdn(30, 75) });
    await page.waitForTimeout(rdn(500, 1000));
    const loginVerification = await page.$eval(
      ".c-header__logout-text.js-logout",
      (element) => {
        return element.innerHTML;
      }
    );
    console.log(loginVerification);
    // if (verificationCookie) {
    //   return { status: 200 };
    // }
    return { status: 400 };
    //--------------------------------------------------------------------------------
  } finally {
    // browser.close();
  }
};

console.log("`ctrl + c` to exit");
process.on("SIGINT", () => {
  console.log("bye!");
  process.exit();
});

module.exports = verifyLoginCredentials;
