import { Type } from 'class-transformer';
import { IsInt, Min, ValidateNested } from 'class-validator';

export class UpdateItemCartPayloadDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}

export class UpdateItemCartDto {
  @ValidateNested()
  @Type(() => UpdateItemCartPayloadDto)
  Cart!: UpdateItemCartPayloadDto;
}
