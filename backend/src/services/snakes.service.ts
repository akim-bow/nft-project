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

@EntityRepository()
class SnakesService extends Repository<UserEntity> {
  // TODO: maybe better solutions
  private static IMAGES_PATH = path.resolve(__dirname + '../../../../images');
  private static SNAKES_PATH = path.join(SnakesService.IMAGES_PATH, 'snakes');
  private static SNAKES_PATTERN_PATH = path.join(SnakesService.IMAGES_PATH, 'snake-patterns');
  private static SNAKES_ATTR_PATH = path.join(SnakesService.IMAGES_PATH, 'snake-attrs');
  private static SNAKES_GENERATED = path.join(SnakesService.IMAGES_PATH, 'generated');

  public async createSnake({ snakeId, patternId, attrId }: CreateSnakeDto): Promise<SnakeUrl> {
    const snakePartNames = ['body', 'curve', 'head', 'tail'] as const;
    const snakeParts = ['body.png', 'curve.png', 'head.png', 'tail.png'] as const;
    const snakePartMasks = ['body_mask.png', 'curve_mask.png', 'head_mask.png', 'tail_mask.png'] as const;

    // TODO: Correctly handle file system error

    const snakePath = path.join(SnakesService.SNAKES_PATH, snakeId);
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

    for (let y = 0; y < snakePattern.length; y++) {
      for (let x = 0; x < snakePattern[y].length; x++) {
        const node = snakePattern[y][x];
        if (!node) continue;
        const [part, deg] = node.split(':') as [string, string];
        const image = await loadImage(path.join(snakePath, part) + '.png');

        const mask = await loadImage(path.join(snakePath, part) + '_mask.png');
        const pattern = await loadImage(path.join(SnakesService.SNAKES_PATTERN_PATH, patternId) + '.png');

        ctx.save();

        ctx.translate(tileSize * x + tileSize / 2, tileSize * y + tileSize / 2);
        ctx.rotate((Number(deg) * Math.PI) / 180);
        ctx.translate(-tileSize / 2, -tileSize / 2);

        ctx.drawImage(image, 0, 0);

        const maskedPattern = createCanvas(32, 32);
        const maskedPatternCtx = maskedPattern.getContext('2d');
        maskedPatternCtx.globalCompositeOperation = 'source-out';

        maskedPatternCtx.drawImage(mask, 0, 0);
        maskedPatternCtx.drawImage(pattern, 0, 0);

        ctx.drawImage(maskedPattern, 0, 0);

        if (attrId) {
          const attr = await loadImage(path.join(SnakesService.SNAKES_ATTR_PATH, attrId) + '.png');
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
