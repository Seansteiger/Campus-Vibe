import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, SearchUsersDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async search(@Query() dto: SearchUsersDto) {
    return this.usersService.search(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, currentUserId, dto);
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow/unfollow a user' })
  @ApiResponse({ status: 200, description: 'Follow status toggled' })
  async follow(
    @Param('id') followeeId: string,
    @CurrentUser('id') followerId: string,
  ) {
    return this.usersService.follow(followerId, followeeId);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiResponse({ status: 200, description: 'List of followers' })
  async getFollowers(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.usersService.getFollowers(id, limit, cursor);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users being followed' })
  @ApiResponse({ status: 200, description: 'List of following' })
  async getFollowing(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.usersService.getFollowing(id, limit, cursor);
  }

  @Get(':id/is-following')
  @ApiOperation({ summary: 'Check if current user follows a user' })
  @ApiResponse({ status: 200, description: 'Following status' })
  async isFollowing(
    @Param('id') followeeId: string,
    @CurrentUser('id') followerId: string,
  ) {
    return this.usersService.isFollowing(followerId, followeeId);
  }
}
