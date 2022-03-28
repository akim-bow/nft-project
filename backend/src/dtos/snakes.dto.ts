import { IsOptional, IsString } from 'class-validator';

export class CreateSnakeDto {
  @IsString()
  public snakeId: string;

  @IsString()
  public patternId: string;

  @IsOptional()
  @IsString()
  public attrId?: string;
}
