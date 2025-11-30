import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('opportunities')
@Controller({ path: 'opportunities', version: '1' })
export class OpportunitiesController {
  constructor(private opportunitiesService: OpportunitiesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search opportunities' })
  @ApiResponse({ status: 200, description: 'List of opportunities' })
  async search(
    @Query('type') type?: string,
    @Query('fieldTags') fieldTags?: string,
    @Query('province') province?: string,
    @Query('yearMin') yearMin?: number,
    @Query('yearMax') yearMax?: number,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.opportunitiesService.search({
      type,
      fieldTags: fieldTags?.split(','),
      province,
      yearMin,
      yearMax,
      limit,
      cursor,
    });
  }

  @Get('match')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get matched opportunities for current user' })
  @ApiResponse({ status: 200, description: 'Matched opportunities' })
  async match(@CurrentUser('id') userId: string) {
    return this.opportunitiesService.matchToUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get opportunity by ID' })
  @ApiResponse({ status: 200, description: 'Opportunity found' })
  async findById(@Param('id') id: string) {
    return this.opportunitiesService.findById(id);
  }

  @Post('ingest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ingest opportunity (admin only)' })
  @ApiResponse({ status: 201, description: 'Opportunity ingested' })
  async ingest(@Body() data: {
    title: string;
    description: string;
    sourceUrl: string;
    fieldTags: string[];
    yearMin?: number;
    yearMax?: number;
    deadline?: string;
    provider?: string;
    type?: string;
    provinces?: string[];
  }) {
    return this.opportunitiesService.ingest(data);
  }
}
