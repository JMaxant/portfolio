// Writes assets/og/background.png: --light-bg with a 1 px --light-border rule under the
// header line. Colours are copied from base/tokens.css. See docs/seo.md#generated-card.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN = 80;
const RULE_Y = 150;
const BG = [0xf9, 0xf9, 0xf9];
const BORDER = [0xd8, 0xdc, 0xe4];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, tail]);
};

const rows = [];
for (let y = 0; y < HEIGHT; y++) {
  const row = Buffer.alloc(1 + WIDTH * 3); // filter byte 0, then RGB
  for (let x = 0; x < WIDTH; x++) {
    const onRule = y === RULE_Y && x >= MARGIN && x < WIDTH - MARGIN;
    row.set(onRule ? BORDER : BG, 1 + x * 3);
  }
  rows.push(row);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(WIDTH, 0);
header.writeUInt32BE(HEIGHT, 4);
header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB

writeFileSync(
  new URL('../../assets/og/background.png', import.meta.url),
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
