import { Transform } from 'class-transformer';
import { Equals, IsEmail, IsIn, IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { trim } from './trim';

export class LoginDto {
  @ApiProperty({ example: 'admin@clena.example' })
  @IsEmail()
  @MaxLength(254)
  @Transform(trim)
  email!: string;
  @ApiProperty({ format: 'password' }) @IsString() @Length(1, 72) password!: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({ example: 'Nombre de demostración' })
  @IsString()
  @Transform(trim)
  @Length(2, 100)
  name!: string;
  @ApiProperty({ minLength: 12, maxLength: 72 })
  @IsString()
  @Length(12, 72)
  declare password: string;
  @ApiProperty({ example: true }) @Equals(true) consent!: boolean;
}

export class CreateUserDto extends RegisterDto {
  @ApiProperty({ enum: ['ADMIN', 'STAFF', 'PUBLIC'] }) @IsIn(['ADMIN', 'STAFF', 'PUBLIC']) role!:
    'ADMIN' | 'STAFF' | 'PUBLIC';
}

export class RefreshDto {
  @ApiProperty() @IsString() @Length(20, 2000) refreshToken!: string;
}

export class DeleteAccountDto {
  @ApiProperty({ format: 'password' }) @IsString() @Length(1, 72) password!: string;
}
