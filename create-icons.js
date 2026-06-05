const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 生成指定尺寸和颜色的 PNG 文件
function createPNG(width, height, r, g, b, alpha = 255) {
  // PNG 文件头
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // 像素数据（带 filter byte）
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    rawData[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const pixStart = rowStart + 1 + x * 4;
      rawData[pixStart] = r;
      rawData[pixStart + 1] = g;
      rawData[pixStart + 2] = b;
      rawData[pixStart + 3] = alpha;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const chunk = Buffer.alloc(4 + 4 + data.length + 4);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4, 'ascii');
    data.copy(chunk, 8);
    const crcData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = crc32(crcData);
    chunk.writeUInt32BE(crc, 8 + data.length);
    return chunk;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 计算
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ (-1)) >>> 0;
}

const iconsDir = path.join(__dirname, 'src', 'static', 'icons');

// 灰色图标 (未选中): #AAAAAA
const gray = createPNG(81, 81, 170, 170, 170, 80);
// 粉色图标 (选中): #E8967A
const pink = createPNG(81, 81, 232, 150, 122, 80);

fs.writeFileSync(path.join(iconsDir, 'home.png'), gray);
fs.writeFileSync(path.join(iconsDir, 'home-active.png'), pink);
fs.writeFileSync(path.join(iconsDir, 'about.png'), gray);
fs.writeFileSync(path.join(iconsDir, 'about-active.png'), pink);

console.log('Icons created: 81x81 PNG files');
console.log('Files:', fs.readdirSync(iconsDir).filter(f => f.endsWith('.png')));
