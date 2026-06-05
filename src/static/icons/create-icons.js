// 使用 Node.js 生成简单的 SVG 图标
// 在实际项目中，应该使用设计好的 PNG 图标

const fs = require('fs');
const path = require('path');

// 简单的 home 图标 SVG
const homeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path fill="#999999" d="M24 4L4 22h6v20h10V30h8v12h10V22h6L24 4z"/>
</svg>`;

const homeActiveIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path fill="#2979FF" d="M24 4L4 22h6v20h10V30h8v12h10V22h6L24 4z"/>
</svg>`;

fs.writeFileSync(path.join(__dirname, 'home.svg'), homeIcon);
fs.writeFileSync(path.join(__dirname, 'home-active.svg'), homeActiveIcon);

console.log('Icons created successfully!');
