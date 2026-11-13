import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListDto {
  @ApiPropertyOptional({ default: 1 }) @Type(() => Number) @IsInt() @Min(1) @Max(1000000) page = 1;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
  @ApiPropertyOptional({
    default: 'createdAt',
    description:
      'Según recurso: createdAt, name, code, title, nextInspectionAt, condition, measuredAt, temperature, humidity, priority, status, dueAt, email, role.',
  })
  @IsString()
  @MaxLength(30)
  sort = 'createdAt';
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' }) @IsIn(['ASC', 'DESC']) order:
    'ASC' | 'DESC' = 'DESC';
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() recordId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() depositId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() alertId?: string;
  @ApiPropertyOptional({ enum: ['ADMIN', 'STAFF', 'PUBLIC'] })
  @IsOptional()
  @IsIn(['ADMIN', 'STAFF', 'PUBLIC'])
  role?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  archived?: boolean;
}
