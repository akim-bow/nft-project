import { IsOptional, IsString } from 'class-validator';

export class CreateSnakeDto {
  @IsString()
  public snakeId: string;

  @IsOptional()
  @IsString()
  public patternId?: string;

  @IsOptional()
  @IsString()
  public attrId?: string;
}
