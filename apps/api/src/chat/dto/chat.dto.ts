import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsBoolean, MaxLength, ArrayMinSize, IsNotEmpty } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ example: ['user-id-1', 'user-id-2'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  memberIds!: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({ example: 'Study Group' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

export class SendMessageDto {
  @ApiPropertyOptional({ example: 'Hello!' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
