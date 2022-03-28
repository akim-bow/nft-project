import { NextFunction, Request, Response } from 'express';

import SnakesService from '@services/snakes.service';
import { CreateSnakeDto } from '@dtos/snakes.dto';

class SnakesController {
  public snakesService = new SnakesService();

  public createSnake = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateSnakeDto = req.body;
      const snakeUrl = await this.snakesService.createSnake(data);
      res.status(200).json({ data: snakeUrl, message: 'minted' });
    } catch (error) {
      next(error);
    }
  };
}

export default SnakesController;
