import { IsString, IsNotEmpty } from 'class-validator';

export class GetCartDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
