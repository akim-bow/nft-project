import { Canvas, PNGStream, loadImage, Image } from 'canvas';
import { createWriteStream } from 'fs';
import { logger } from '@utils/logger';

type ImageType = 'png';

export function getImageFromFile(filename: string): Promise<Image> {
  return loadImage(filename);
}

export function saveImage(canvas: Canvas, filename: string, type: ImageType): Promise<void> {
  return new Promise((resolve, reject) => {
    let stream: PNGStream;

    switch (type) {
      case 'png':
        stream = canvas.createPNGStream();
        break;
    }

    const out = createWriteStream(filename + '.' + type);
    stream.pipe(out);
    out
      .on('finish', () => {
        logger.info(`The ${type.toUpperCase()} file was created.`);
        resolve();
      })
      .on('error', reject);
  });
}
