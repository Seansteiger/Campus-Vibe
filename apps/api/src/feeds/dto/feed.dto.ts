import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

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
  @ApiPropertyOptional()
  @IsString()
  campusId: string;
}

export class UniversityFeedDto extends FeedQueryDto {
  @ApiPropertyOptional()
  @IsString()
  universityId: string;
}

export class ProvinceFeedDto extends FeedQueryDto {
  @ApiPropertyOptional()
  @IsString()
  province: string;
}
