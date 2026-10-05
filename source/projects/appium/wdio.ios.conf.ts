import path from 'path';
import { config as baseConfig, ROOT } from './wdio.conf';

// iOS requires a macOS host with Xcode — kept for parity, not runnable on Windows.
export const config: WebdriverIO.Config = {
  ...baseConfig,
  port: 4723,
  capabilities: [{
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': process.env.IOS_DEVICE_NAME,
    'appium:app': path.resolve(ROOT, process.env.IOS_APP_PATH ?? ''),
  }],
};
