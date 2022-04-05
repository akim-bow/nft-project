import { IsOptional, IsString } from 'class-validator';

export class CreateSnakeDto {
  @IsOptional()
  @IsString()
  public arenaId?: string;

  @IsOptional()
  @IsString()
  public snakeId?: string;

  @IsOptional()
  @IsString()
  public schemaId?: string;

  @IsOptional()
  @IsString()
  public patternId?: string;

  @IsOptional()
  @IsString()
  public attrId?: string;
}
