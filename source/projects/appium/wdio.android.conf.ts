import path from 'path';
import { config as baseConfig, ROOT } from './wdio.conf';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  port: 4723,
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME,
    'appium:app': path.resolve(ROOT, process.env.ANDROID_APP_PATH ?? ''),
    'appium:autoGrantPermissions': true,
  }],
};
