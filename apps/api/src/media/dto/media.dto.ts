import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class PresignedUrlDto {
  @ApiProperty({ example: 'photo.jpg' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  contentType: string;
}

export class MediaCallbackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mediaId: string;

  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  width?: number;

  @ApiProperty()
  height?: number;

  @ApiProperty()
  duration?: number;

  @ApiProperty()
  thumbnailUrl?: string;
}
