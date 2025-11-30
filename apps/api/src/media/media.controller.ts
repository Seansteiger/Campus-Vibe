import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { PresignedUrlDto, MediaCallbackDto } from './dto/media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('media')
@Controller({ path: 'media', version: '1' })
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for upload' })
  @ApiResponse({ status: 201, description: 'Presigned URL generated' })
  async getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.mediaService.getPresignedUrl(dto);
  }

  @Post('callback')
  @Public()
  @ApiOperation({ summary: 'Callback from transcoder' })
  @ApiResponse({ status: 200, description: 'Media updated' })
  async handleCallback(@Body() dto: MediaCallbackDto) {
    return this.mediaService.handleCallback(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get media by ID' })
  @ApiResponse({ status: 200, description: 'Media found' })
  async findById(@Param('id') id: string) {
    return this.mediaService.findById(id);
  }
}
