import { Controller, Get, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { FeedsService } from './feeds.service';
import { FeedQueryDto, CampusFeedDto, UniversityFeedDto, ProvinceFeedDto } from './dto/feed.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('feeds')
@Controller({ path: 'feeds', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedsController {
  constructor(private feedsService: FeedsService) {}

  @Get('campus')
  @ApiOperation({ summary: 'Get campus feed' })
  @ApiResponse({ status: 200, description: 'Campus feed' })
  @ApiHeader({ name: 'x-experiment-id', required: false })
  async getCampusFeed(
    @Query() dto: CampusFeedDto,
    @CurrentUser('id') userId: string,
    @Headers('x-experiment-id') experimentId?: string,
  ) {
    return this.feedsService.getCampusFeed(dto.campusId, userId, dto, experimentId);
  }

  @Get('university')
  @ApiOperation({ summary: 'Get university feed' })
  @ApiResponse({ status: 200, description: 'University feed' })
  @ApiHeader({ name: 'x-experiment-id', required: false })
  async getUniversityFeed(
    @Query() dto: UniversityFeedDto,
    @CurrentUser('id') userId: string,
    @Headers('x-experiment-id') experimentId?: string,
  ) {
    return this.feedsService.getUniversityFeed(dto.universityId, userId, dto, experimentId);
  }

  @Get('province')
  @ApiOperation({ summary: 'Get province feed' })
  @ApiResponse({ status: 200, description: 'Province feed' })
  @ApiHeader({ name: 'x-experiment-id', required: false })
  async getProvinceFeed(
    @Query() dto: ProvinceFeedDto,
    @CurrentUser('id') userId: string,
    @Headers('x-experiment-id') experimentId?: string,
  ) {
    return this.feedsService.getProvinceFeed(dto.province, userId, dto, experimentId);
  }

  @Get('national')
  @ApiOperation({ summary: 'Get national feed' })
  @ApiResponse({ status: 200, description: 'National feed' })
  @ApiHeader({ name: 'x-experiment-id', required: false })
  async getNationalFeed(
    @Query() dto: FeedQueryDto,
    @CurrentUser('id') userId: string,
    @Headers('x-experiment-id') experimentId?: string,
  ) {
    return this.feedsService.getNationalFeed(userId, dto, experimentId);
  }

  @Get('personalized')
  @ApiOperation({ summary: 'Get personalized feed' })
  @ApiResponse({ status: 200, description: 'Personalized feed' })
  @ApiHeader({ name: 'x-experiment-id', required: false })
  async getPersonalizedFeed(
    @Query() dto: FeedQueryDto,
    @CurrentUser('id') userId: string,
    @Headers('x-experiment-id') experimentId?: string,
  ) {
    return this.feedsService.getPersonalizedFeed(userId, dto, experimentId);
  }
}
