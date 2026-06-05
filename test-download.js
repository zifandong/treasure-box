const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const downloadDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();

  // 监听下载事件
  const downloads = [];
  page.on('download', async (download) => {
    console.log('Download triggered:', download.suggestedFilename());
    const filePath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(filePath);
    downloads.push(filePath);
    console.log('Saved to:', filePath);
  });

  // 访问图片压缩页面
  console.log('Navigating to image compress page...');
  await page.goto('http://localhost:5174/#/pages/image-compress/index');
  await page.waitForTimeout(2000);

  // 监听 file chooser 事件
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('.upload-area')
  ]);

  // 选择测试图片
  const testImagePath = path.join(downloadDir, 'test-image.png');
  if (!fs.existsSync(testImagePath)) {
    const minPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xD8, 0xAB, 0xF9, 0xC9,
      0x00, 0x00, 0x00, 0x40, 0x00, 0x01, 0x73, 0xF0, 0xD4, 0xFA, 0x16, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(testImagePath, minPng);
    console.log('Created test PNG file');
  }

  await fileChooser.setFiles(testImagePath);
  console.log('File uploaded');
  await page.waitForTimeout(1000);

  // 点击压缩按钮
  const compressBtn = await page.$('.btn-primary');
  if (compressBtn) {
    console.log('Clicking compress button...');
    await compressBtn.click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: path.join(downloadDir, 'after-compress.png'), fullPage: true });

  // 关闭弹窗（点击确定按钮）
  console.log('Closing modal...');
  const modalConfirmBtn = await page.locator('.modal-btn-primary');
  if (await modalConfirmBtn.isVisible()) {
    await modalConfirmBtn.click();
    await page.waitForTimeout(500);
  }

  // 点击下载全部按钮
  console.log('Clicking download button...');
  const downloadBtn = await page.locator('text=下载全部');
  await downloadBtn.click({ timeout: 5000 });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(downloadDir, 'after-download.png'), fullPage: true });

  console.log('Total downloads triggered:', downloads.length);
  console.log('Downloaded files:', downloads);

  await browser.close();
  console.log(