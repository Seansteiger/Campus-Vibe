import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class FeedQueryDto {
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class CampusFeedDto extends FeedQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  campusId!: string;
}

export class UniversityFeedDto extends FeedQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  universityId!: string;
}

export class ProvinceFeedDto extends FeedQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  province!: string;
}
