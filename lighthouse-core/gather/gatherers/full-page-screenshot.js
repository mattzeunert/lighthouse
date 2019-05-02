/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('./gatherer.js');

class FullPageScreenshot extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   */
  async afterPass(passContext) {
    const quality = 30;
    const maxScreenshotHeight = 20000;

    const driver = passContext.driver;
    const metrics = await driver.sendCommand('Page.getLayoutMetrics');
    const width = Math.ceil(metrics.contentSize.width);
    let height = Math.ceil(metrics.contentSize.height);

    height = Math.min(maxScreenshotHeight, height);

    // note: resize can sometimes cause layout to change
    await driver.sendCommand('Emulation.setDeviceMetricsOverride', {
      // todo: figure out what this means and set appropriately
      mobile: true,
      width,
      height,
      deviceScaleFactor: 1,
    });

    const result = await driver.sendCommand('Page.captureScreenshot', {format: 'jpeg', quality: quality});
    const data = 'data:image/jpeg;base64,' + result.data;

    return {
      data,
    };
  }
}

module.exports = FullPageScreenshot;
