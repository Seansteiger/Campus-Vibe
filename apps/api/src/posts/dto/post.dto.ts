import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, MaxLength, IsNotEmpty } from 'class-validator';

enum Visibility {
  CAMPUS = 'CAMPUS',
  UNIVERSITY = 'UNIVERSITY',
  PROVINCE = 'PROVINCE',
  NATIONAL = 'NATIONAL',
}

export class CreatePostDto {
  @ApiPropertyOptional({ example: 'Just aced my exam! 🎉' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ example: ['media-id-1', 'media-id-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaIds?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAcademic?: boolean;

  @ApiPropertyOptional({ enum: Visibility, default: Visibility.CAMPUS })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional({ example: ['study', 'exam'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ enum: Visibility })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class SharePostDto {
  @ApiPropertyOptional({ example: 'Check this out!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;
}
