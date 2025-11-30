import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, SharePostDto } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('posts')
@Controller({ path: 'posts', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: 200, description: 'Post found' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.findById(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'Post updated' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'Post deleted' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.delete(id, userId);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like/unlike a post' })
  @ApiResponse({ status: 200, description: 'Like toggled' })
  async like(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.like(postId, userId);
  }

  @Post(':id/comment')
  @ApiOperation({ summary: 'Comment on a post' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  async comment(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.comment(postId, userId, dto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get post comments' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  async getComments(
    @Param('id') postId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.postsService.getComments(postId, limit, cursor);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share a post' })
  @ApiResponse({ status: 201, description: 'Post shared' })
  async share(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SharePostDto,
  ) {
    return this.postsService.share(postId, userId, dto);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save/unsave a post' })
  @ApiResponse({ status: 200, description: 'Save toggled' })
  async save(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.save(postId, userId);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a post' })
  @ApiResponse({ status: 201, description: 'Report submitted' })
  async report(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason: string; details?: string },
  ) {
    return this.postsService.report(postId, userId, body.reason, body.details);
  }
}
