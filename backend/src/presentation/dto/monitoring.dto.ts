import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { trim } from './trim';

export class InspectionDto {
  @ApiProperty({ enum: ['OPTIMO', 'REGULAR', 'CRITICO'] })
  @IsIn(['OPTIMO', 'REGULAR', 'CRITICO'])
  condition!: 'OPTIMO' | 'REGULAR' | 'CRITICO';
  @ApiProperty() @IsString() @Transform(trim) @Length(10, 2000) notes!: string;
  @ApiProperty() @IsBoolean() pests!: boolean;
  @ApiProperty() @IsBoolean() wear!: boolean;
  @ApiProperty() @IsBoolean() moisture!: boolean;
}

export class ReadingDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() depositId!: string;
  @ApiProperty({ example: 'SIM-A-01' })
  @IsString()
  @Transform(trim)
  @Length(2, 80)
  sensorId!: string;
  @ApiProperty({ example: 22 }) @IsNumber() @Min(-50) @Max(80) temperature!: number;
  @ApiProperty({ example: 50 }) @IsNumber() @Min(0) @Max(100) humidity!: number;
  @ApiProperty({ format: 'date-time' }) @IsDateString({ strict: true }) measuredAt!: string;
}
