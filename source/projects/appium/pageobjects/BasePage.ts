export default class BasePage {
  async waitForDisplayed(selector: string, timeout = 10000) {
    const el = await $(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }
}
