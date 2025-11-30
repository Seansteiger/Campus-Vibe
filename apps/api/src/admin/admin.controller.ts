import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Get admin stats' })
  @ApiResponse({ status: 200, description: 'Admin stats' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('moderation/queue')
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Get moderation queue' })
  @ApiResponse({ status: 200, description: 'Moderation queue' })
  async getModerationQueue(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminService.getModerationQueue(status, limit, cursor);
  }

  @Post('moderation/:id/action')
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Take action on a report' })
  @ApiResponse({ status: 200, description: 'Action taken' })
  async takeAction(
    @Param('id') reportId: string,
    @CurrentUser('id') moderatorId: string,
    @Body() body: { action: 'approve' | 'remove' | 'warn' | 'ban' },
  ) {
    return this.adminService.takeAction(reportId, moderatorId, body.action);
  }

  @Get('verification/queue')
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Get verification queue' })
  @ApiResponse({ status: 200, description: 'Verification queue' })
  async getVerificationQueue(
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminService.getVerificationQueue(limit, cursor);
  }

  @Post('verification/:id/action')
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Handle verification request' })
  @ApiResponse({ status: 200, description: 'Verification handled' })
  async handleVerification(
    @Param('id') requestId: string,
    @CurrentUser('id') moderatorId: string,
    @Body() body: { action: 'approve' | 'reject'; notes?: string },
  ) {
    return this.adminService.handleVerification(requestId, moderatorId, body.action, body.notes);
  }

  @Get('domains')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get accepted domains' })
  @ApiResponse({ status: 200, description: 'Accepted domains' })
  async getAcceptedDomains() {
    return this.adminService.getAcceptedDomains();
  }

  @Post('domains')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add accepted domain' })
  @ApiResponse({ status: 201, description: 'Domain added' })
  async addAcceptedDomain(
    @Body() body: { domain: string; universityId?: string },
  ) {
    return this.adminService.addAcceptedDomain(body.domain, body.universityId);
  }
}
