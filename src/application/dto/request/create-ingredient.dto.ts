import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
  IsUrl,
} from 'class-validator';

export class IngredientDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del ingrediente no puede estar vacío' })
  name: string;

  @IsNumber()
  @IsNotEmpty({ message: 'La cantidad del ingrediente es obligatoria' })
  quantity: number;

  @IsString()
  @IsIn(['g', 'kg', 'ml', 'l', 'unit'], {
    message: 'La unidad del ingrediente no es válida',
  })
  unit: 'g' | 'kg' | 'ml' | 'l' | 'unit';

  @IsOptional()
  @IsUrl({}, { message: 'La imagen del ingrediente debe ser una URL válida' })
  image?: string;
}
