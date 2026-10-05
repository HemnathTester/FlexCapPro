describe('Smoke', () => {
  it('app launches into the foreground', async function () {
    if (!driver.isAndroid) {
      // TODO iOS: assert bundleId via `mobile: activeAppInfo` — skipped visibly, not passed.
      this.skip();
    }
    // Real, observable check: the app under test is the foreground package.
    await expect(await driver.getCurrentPackage()).toBe(process.env.ANDROID_APP_ID);
  });
});
