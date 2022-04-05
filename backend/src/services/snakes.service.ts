import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { EntityRepository, Repository } from 'typeorm';
import { SECRET_KEY } from '@config';
import { CreateUserDto } from '@dtos/users.dto';
import { UserEntity } from '@entities/users.entity';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { isEmpty } from '@utils/util';
import { createCanvas, loadImage } from 'canvas';
import { saveImage } from '@utils/graphic';
import path from 'path';
import randomstring from 'randomstring';
import { CreateSnakeDto } from '@dtos/snakes.dto';
import * as fs from 'fs';
import _ from 'lodash';
import { SnakeAsset, SnakeAssets, SnakeMetadata, SnakeUrl } from '@interfaces/snakes.interface';

@EntityRepository()
class SnakesService extends Repository<UserEntity> {
  // TODO: maybe better solutions
  private static IMAGES_PATH = path.resolve(__dirname + '../../../../images');
  private static SNAKES_PATH = path.join(SnakesService.IMAGES_PATH, 'snakes');
  private static ARENAS_PATH = path.join(SnakesService.IMAGES_PATH, 'arenas');
  private static SNAKES_PATTERN_PATH = path.join(SnakesService.IMAGES_PATH, 'snake-patterns');
  private static SNAKES_GENERATED = path.join(SnakesService.IMAGES_PATH, 'generated');

  private static async readJson<T = any>(filePath: string): Promise<T> {
    return JSON.parse((await fs.promises.readFile(filePath)).toString());
  }

  public async createSnake({ snakeId, patternId, schemaId, attrId, arenaId }: CreateSnakeDto): Promise<SnakeUrl> {
    const snakePartNames = ['body', 'curve', 'head', 'tail'] as const;
    const snakeParts = ['body.png', 'curve.png', 'head.png', 'tail.png'] as const;
    const snakePartMasks = ['body_mask.png', 'curve_mask.png', 'head_mask.png', 'tail_mask.png'] as const;

    if (!arenaId) {
      const arenas = await fs.promises.readdir(SnakesService.ARENAS_PATH);
      arenaId = _.sample(arenas);
    }

    if (!snakeId) {
      const snakes = await fs.promises.readdir(SnakesService.SNAKES_PATH);
      snakeId = _.sample(snakes);
    }

    const snakePath = path.join(SnakesService.SNAKES_PATH, snakeId);
    const arenaPath = path.join(SnakesService.ARENAS_PATH, arenaId);
    const snakeMetadata = await SnakesService.readJson<SnakeMetadata>(path.join(snakePath, 'metadata.json'));

    if (!patternId) {
      if (Math.random() > 0.5 && snakeMetadata.mask) {
        await fs.promises.readFile(path.join(snakePath));
        const patterns = (await fs.promises.readdir(SnakesService.SNAKES_PATTERN_PATH)).map(file => file.slice(0, -4));
        patternId = _.sample(patterns);
      }
    }

    if (!schemaId) {
      const schemas = Object.keys(snakeMetadata.schemas);
      schemaId = _.sample(schemas);
    }

    if (!attrId) {
      if (Math.random() > 0.5) {
        const attrs = snakeMetadata.attrSets;
        attrId = _.sample(attrs);
      }
    }

    let attrFiles = [];

    if (attrId) {
      attrFiles = (await fs.promises.readdir(path.join(snakePath, 'attr-sets', attrId))).map(file => file.slice(0, -4));
    }

    const defaultSchema = snakeMetadata.schemas['default'].map(schema => schema.match(/\w\w/g).map(x => parseInt(x, 16)));
    const selectedSchema = snakeMetadata.schemas[schemaId].map(schema => schema.match(/\w\w/g).map(x => parseInt(x, 16)));

    if (defaultSchema.length !== selectedSchema.length) {
      throw new Error('Bad schema');
    }

    const mapper = _.zipObject(
      defaultSchema.map(pixels => pixels.join('.')),
      selectedSchema,
    );

    const tileSize = 32;

    const snakePatterns = await SnakesService.readJson(path.join(SnakesService.IMAGES_PATH, 'snakes-figures.json'));
    const snakePattern = _.sample(snakePatterns);

    const arenaWidth = 3;
    const arenaHeight = 5;
    const arenaSnakeTop = 0;
    const arenaSnakeLeft = 0;

    const arenaCanvas = createCanvas(tileSize * (arenaWidth + 1), tileSize * (arenaHeight + 1));
    const arenaCtx = arenaCanvas.getContext('2d');

    const arenaAngle = await loadImage(path.join(arenaPath, 'angle.png'));
    const arenaBorders = {
      ver: [await loadImage(path.join(arenaPath, 'border_ver_01.png')), await loadImage(path.join(arenaPath, 'border_ver_02.png'))],
      hor: [await loadImage(path.join(arenaPath, 'border_hor_01.png')), await loadImage(path.join(arenaPath, 'border_hor_02.png'))],
    };

    const arenaTiles = {
      common: await loadImage(path.join(arenaPath, 'tile_001.png')),
      rare: [await loadImage(path.join(arenaPath, 'tile_002.png')), await loadImage(path.join(arenaPath, 'tile_003.png'))],
    };

    // Draws arena angles
    arenaCtx.drawImage(arenaAngle, 0, 0);
    arenaCtx.drawImage(arenaAngle, 0, arenaCanvas.height - 16);
    arenaCtx.drawImage(arenaAngle, arenaCanvas.width - 16, 0);
    arenaCtx.drawImage(arenaAngle, arenaCanvas.width - 16, arenaCanvas.height - 16);

    for (let x = 0; x < arenaWidth; x++) {
      arenaCtx.drawImage(arenaBorders.hor[x % 2], 16 + x * 32, 0);
      arenaCtx.drawImage(arenaBorders.hor[x % 2], 16 + x * 32, arenaCanvas.height - 16);
    }

    for (let y = 0; y < arenaHeight; y++) {
      arenaCtx.drawImage(arenaBorders.ver[y % 2], 0, 16 + y * 32);
      arenaCtx.drawImage(arenaBorders.ver[y % 2], arenaCanvas.width - 16, 16 + y * 32);
    }

    for (let y = 0; y < arenaHeight; y++) {
      for (let x = 0; x < arenaWidth; x++) {
        const isRareTale = Math.random() >= 0.8;
        if (isRareTale) {
          arenaCtx.drawImage(_.sample(arenaTiles.rare), 16 + x * 32, 16 + y * 32);
        } else {
          arenaCtx.drawImage(arenaTiles.common, 16 + x * 32, 16 + y * 32);
        }
      }
    }

    const canvas = createCanvas(96, 96);
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < snakePattern.length; y++) {
      for (let x = 0; x < snakePattern[y].length; x++) {
        const node = snakePattern[y][x];
        if (!node) continue;
        const [part, deg] = node.split(':') as [string, string];

        if (part === 'block') {
          const block = await loadImage(path.join(SnakesService.IMAGES_PATH, 'block.png'));
          ctx.drawImage(block, tileSize * x, tileSize * y);
          continue;
        }

        const image = await loadImage(path.join(snakePath, part) + '.png');

        ctx.save();

        ctx.translate(tileSize * x + tileSize / 2, tileSize * y + tileSize / 2);
        ctx.rotate((Number(deg) * Math.PI) / 180);
        ctx.translate(-tileSize / 2, -tileSize / 2);

        ctx.drawImage(image, 0, 0);

        if (schemaId && schemaId !== 'default') {
          const imageData = ctx.getImageData(x * 32, y * 32, 32, 32);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const currentPixel = [data[i], data[i + 1], data[i + 2]];
            const mapperKey = currentPixel.join('.');
            const mapperPixels = mapper[mapperKey];

            if (mapperPixels) {
              data[i] = mapperPixels[0];
              data[i + 1] = mapperPixels[1];
              data[i + 2] = mapperPixels[2];
            }
          }

          ctx.putImageData(imageData, x * 32, y * 32);
        }

        if (patternId) {
          const mask = await loadImage(path.join(snakePath, part) + '_mask.png');
          const pattern = await loadImage(path.join(SnakesService.SNAKES_PATTERN_PATH, patternId) + '.png');

          const maskedPattern = createCanvas(32, 32);
          const maskedPatternCtx = maskedPattern.getContext('2d');
          maskedPatternCtx.globalCompositeOperation = 'source-out';

          maskedPatternCtx.drawImage(mask, 0, 0);
          maskedPatternCtx.drawImage(pattern, 0, 0);
          ctx.drawImage(maskedPattern, 0, 0);
        }

        if (attrId && attrFiles.includes(part)) {
          const attr = await loadImage(path.join(snakePath, 'attr-sets', attrId, part) + '.png');
          ctx.drawImage(attr, 0, 0);
        }

        ctx.restore();
      }
    }

    const filename = randomstring.generate(8);

    arenaCtx.drawImage(canvas, 16, 16);

    await saveImage(arenaCanvas, path.join(SnakesService.SNAKES_GENERATED, filename), 'png');

    return {
      url: `/images/generated/${filename}.png`,
    };
  }

  public async getSnakeAssets(): Promise<SnakeAssets> {
    const patterns = (await fs.promises.readdir(SnakesService.SNAKES_PATTERN_PATH)).map(file => file.slice(0, -4));
    const snakesDirs = await fs.promises.readdir(SnakesService.SNAKES_PATH);
    const arenas = await fs.promises.readdir(SnakesService.ARENAS_PATH);

    const snakes: SnakeAsset[] = [];

    for (const snakeId of snakesDirs) {
      const snakeAttrPaths = path.join(SnakesService.SNAKES_PATH, snakeId, 'attr-sets');
      const metadataPath = path.join(SnakesService.SNAKES_PATH, snakeId, 'metadata.json');
      const snakeMetadata = await SnakesService.readJson<SnakeMetadata>(metadataPath);

      const attrs = await fs.promises.readdir(snakeAttrPaths);

      snakes.push({
        id: snakeId,
        attrs,
        schemas: Object.keys(snakeMetadata),
      });
    }

    return {
      arenas,
      patterns,
      snakes,
    };
  }
}

export default SnakesService;
