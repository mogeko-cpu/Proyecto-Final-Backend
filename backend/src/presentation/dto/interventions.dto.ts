import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { trim } from './trim';

export class TaskDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() alertId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() assigneeId!: string;
  @ApiProperty() @IsString() @Transform(trim) @Length(5, 200) title!: string;
  @ApiProperty({ format: 'date-time' }) @IsDateString({ strict: true }) dueAt!: string;
}

export class TaskUpdateDto {
  @ApiProperty({ enum: ['IN_PROGRESS', 'DONE'] }) @IsIn(['IN_PROGRESS', 'DONE']) status!:
    'IN_PROGRESS' | 'DONE';
  @ApiProperty({ example: 'Se realizó la intervención y se documentaron sus resultados.' })
  @IsString()
  @MaxLength(2000)
  resolution!: string;
}
