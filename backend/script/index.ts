import { createCanvas, loadImage, PNGStream } from 'canvas';
import { createWriteStream } from 'fs';
import path from 'path';

function savePng(stream: PNGStream, filename: string) {
  const out = createWriteStream(filename);
  stream.pipe(out);
  out.on('finish', () => console.log('The PNG file was created.'));
}

(async () => {
  const canvas = createCanvas(32, 32);

  const ctx = canvas.getContext('2d');

  const main = createCanvas(96, 96);
  const mainCtx = main.getContext('2d');
  mainCtx.fillStyle = '#fff';
  mainCtx.fillRect(0, 0, 96, 96);

  const piece = await loadImage(path.join(__dirname + '../../../images', 'snakes/aaaaaaaa/body') + '.png');
  const mask = await loadImage(path.join(__dirname + '../../../images', 'snakes/aaaaaaaa/body_mask') + '.png');
  const pattern = await loadImage(path.join(__dirname + '../../../images', 'snake-patterns/pattern_001') + '.png');

  mainCtx.translate(16, 16);
  mainCtx.rotate((90 * Math.PI) / 180);
  mainCtx.translate(-16, -16);

  mainCtx.drawImage(piece, 0, 0);

  ctx.globalCompositeOperation = 'source-out';

  ctx.drawImage(mask, 0, 0);
  ctx.drawImage(pattern, 0, 0);

  ctx.globalCompositeOperation = 'source-over';

  // ctx.rotate((-90 * Math.PI) / 180);

  mainCtx.drawImage(canvas, 0, 0);

  savePng(main.createPNGStream(), __dirname + '/test.png');
})();
