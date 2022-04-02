import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import SnakesController from '@controllers/snakes.controller';
import validationMiddleware from '@middlewares/validation.middleware';
import { CreateSnakeDto } from '@dtos/snakes.dto';

class SnakesRoute implements Routes {
  public path = '/snakes';
  public router = Router();
  public snakesController = new SnakesController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/assets`, this.snakesController.getAvailableAssets);
    this.router.post(`${this.path}/mint`, validationMiddleware(CreateSnakeDto, 'body'), this.snakesController.createSnake);
  }
}

export default SnakesRoute;
