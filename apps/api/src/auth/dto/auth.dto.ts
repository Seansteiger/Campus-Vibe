import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsInt, Min, Max, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@wits.ac.za' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  universityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campusId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  year?: number;
}

export class LoginDto {
  @ApiProperty({ example: 'student@wits.ac.za' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
