import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsString, IsUUID, Length, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { trim } from './trim';

export class DepositDto {
  @ApiProperty() @IsString() @Transform(trim) @Length(2, 100) name!: string;
  @ApiProperty({ example: 18 }) @IsNumber() @Min(-50) @Max(80) tempMin!: number;
  @ApiProperty({ example: 24 }) @IsNumber() @Min(-50) @Max(80) tempMax!: number;
  @ApiProperty({ example: 40 }) @IsNumber() @Min(0) @Max(100) humidityMin!: number;
  @ApiProperty({ example: 60 }) @IsNumber() @Min(0) @Max(100) humidityMax!: number;
}

export class RecordDto {
  @ApiProperty({ example: 'EXP-001' }) @IsString() @Transform(trim) @Length(2, 40) code!: string;
  @ApiProperty() @IsString() @Transform(trim) @Length(3, 200) title!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() depositId!: string;
  @ApiProperty({ example: 'E-01' }) @IsString() @Transform(trim) @Length(1, 50) shelf!: string;
  @ApiProperty({ example: 'C-01' }) @IsString() @Transform(trim) @Length(1, 50) box!: string;
  @ApiProperty({ example: 'Descripción del expediente' })
  @IsString()
  @MaxLength(2000)
  description!: string;
  @ApiProperty({ example: 30 }) @IsInt() @Min(1) @Max(365) inspectionDays!: number;
}
