import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateSnakeDto {
  @IsString()
  public snakeId: string;

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
