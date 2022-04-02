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
import { SnakeUrl } from '@interfaces/snakes.interface';
import { Schema } from 'inspector';

@EntityRepository()
class SnakesService extends Repository<UserEntity> {
  // TODO: maybe better solutions
  private static IMAGES_PATH = path.resolve(__dirname + '../../../../images');
  private static SNAKES_PATH = path.join(SnakesService.IMAGES_PATH, 'snakes');
  private static SNAKES_PATTERN_PATH = path.join(SnakesService.IMAGES_PATH, 'snake-patterns');
  private static SNAKES_GENERATED = path.join(SnakesService.IMAGES_PATH, 'generated');

  public async createSnake({ snakeId, patternId, schemaId, attrId }: CreateSnakeDto): Promise<SnakeUrl> {
    const snakePartNames = ['body', 'curve', 'head', 'tail'] as const;
    const snakeParts = ['body.png', 'curve.png', 'head.png', 'tail.png'] as const;
    const snakePartMasks = ['body_mask.png', 'curve_mask.png', 'head_mask.png', 'tail_mask.png'] as const;

    // TODO: Correctly handle file system error

    const snakePath = path.join(SnakesService.SNAKES_PATH, snakeId);

    if (!patternId) {
      if (Math.random() > 0.5) {
        const patterns = (await fs.promises.readdir(SnakesService.SNAKES_PATTERN_PATH)).map(file => file.slice(0, -4));

        patternId = _.sample(patterns);
      }
    }

    if (!schemaId) {
      if (Math.random() > 0.5) {
        const snakeSchemaPaths = path.join(SnakesService.SNAKES_PATH, snakeId, 'schemas');
        const schemas = (await fs.promises.readdir(snakeSchemaPaths)).map(file => file.slice(0, -5));

        schemaId = _.sample(schemas);
      } else {
        schemaId = 'default';
      }
    }

    if (!attrId) {
      if (Math.random() > 0.5) {
        const snakeAttrPaths = path.join(SnakesService.SNAKES_PATH, snakeId, 'attr-sets');
        const attrs = await fs.promises.readdir(snakeAttrPaths);

        attrId = _.sample(attrs);
      }
    }

    let attrFiles = [];

    if (attrId) {
      attrFiles = (await fs.promises.readdir(path.join(snakePath, 'attr-sets', attrId))).map(file => file.slice(0, -4));
    }

    const schemaPath = path.join(snakePath, 'schemas');

    // const schemaPath = path.join(snakePath, 'schemas', (schemeId || 'default') + '.json');
    const defaultSchema = JSON.parse((await fs.promises.readFile(path.join(schemaPath, 'default.json'))).toString()) as [number, number, number][];
    const selectedSchema = JSON.parse((await fs.promises.readFile(path.join(schemaPath, schemaId + '.json'))).toString()) as [
      number,
      number,
      number,
    ][];

    if (defaultSchema.length !== selectedSchema.length) {
      throw new Error('Bad schema');
    }

    const mapper = _.zipObject(
      defaultSchema.map(pixels => pixels.join('.')),
      selectedSchema,
    );

    // const snakeFiles = await fs.promises.readdir(snakePath);

    // const snakePartFiles = _.intersection(snakeParts, snakeFiles);
    // const snakePartMaskFiles = _.intersection(snakePartMasks, snakeFiles);
    //
    // if (snakePartFiles.length !== 4 || snakePartMaskFiles.length !== 4) throw new Error('Invalid snake assets');

    const width = 96;
    const height = 96;

    const tileSize = 32;

    const snakePattern = [
      ['curve:270', 'body:0', 'tail:0'],
      ['body:270', null, null],
      ['head:270', null, null],
    ];

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < snakePattern.length; y++) {
      for (let x = 0; x < snakePattern[y].length; x++) {
        const node = snakePattern[y][x];
        if (!node) continue;
        const [part, deg] = node.split(':') as [string, string];
        const image = await loadImage(path.join(snakePath, part) + '.png');

        ctx.save();

        ctx.translate(tileSize * x + tileSize / 2, tileSize * y + tileSize / 2);
        ctx.rotate((Number(deg) * Math.PI) / 180);
        ctx.translate(-tileSize / 2, -tileSize / 2);

        ctx.drawImage(image, 0, 0);

        if (schemaId) {
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

    await saveImage(canvas, path.join(SnakesService.SNAKES_GENERATED, filename), 'png');

    return {
      url: `/images/generated/${filename}.png`,
    };
  }
}

export default SnakesService;
