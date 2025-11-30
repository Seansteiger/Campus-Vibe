import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../common/prisma/prisma.service';
import { PresignedUrlDto, MediaCallbackDto } from './dto/media.dto';
import { SUPPORTED_IMAGE_TYPES, SUPPORTED_VIDEO_TYPES } from '@campus-vibe/shared';

// NOTE: For production AWS S3 usage, uncomment and configure:
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class MediaService {
  private s3Endpoint: string;
  private s3Bucket: string;
  private s3AccessKey: string;
  private s3SecretKey: string;
  // private s3Client: S3Client; // Uncomment for production

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.s3Endpoint = this.configService.get('S3_ENDPOINT') || 'http://localhost:9000';
    this.s3Bucket = this.configService.get('S3_BUCKET') || 'campus-vibe';
    this.s3AccessKey = this.configService.get('S3_ACCESS_KEY') || '';
    this.s3SecretKey = this.configService.get('S3_SECRET') || '';

    // Production S3 client initialization (uncomment for production):
    // if (process.env.NODE_ENV === 'production' && this.s3AccessKey && this.s3SecretKey) {
    //   this.s3Client = new S3Client({
    //     region: this.configService.get('AWS_REGION') || 'af-south-1',
    //     credentials: {
    //       accessKeyId: this.s3AccessKey,
    //       secretAccessKey: this.s3SecretKey,
    //     },
    //   });
    // }
  }

  async getPresignedUrl(dto: PresignedUrlDto) {
    const { filename, contentType } = dto;

    // Validate content type
    if (![...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES].includes(contentType)) {
      throw new BadRequestException('Unsupported file type');
    }

    // Determine media type
    const type = SUPPORTED_IMAGE_TYPES.includes(contentType) ? 'IMAGE' : 'VIDEO';

    // Generate unique key
    const ext = filename.split('.').pop();
    const key = `uploads/${uuidv4()}.${ext}`;

    // Create media record
    const media = await this.prisma.media.create({
      data: {
        url: `${this.s3Endpoint}/${this.s3Bucket}/${key}`,
        mime: contentType,
        type,
        transcoded: false,
      },
    });

    // Generate upload URL
    // In production with AWS S3, use presigned URL:
    // if (process.env.NODE_ENV === 'production' && this.s3Client) {
    //   const command = new PutObjectCommand({
    //     Bucket: this.s3Bucket,
    //     Key: key,
    //     ContentType: contentType,
    //   });
    //   const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    //   return { uploadUrl, mediaId: media.id, key };
    // }

    // For development with MinIO, construct direct URL
    const uploadUrl = `${this.s3Endpoint}/${this.s3Bucket}/${key}`;

    return {
      uploadUrl,
      mediaId: media.id,
      key,
    };
  }

  async handleCallback(dto: MediaCallbackDto) {
    const { mediaId, key, width, height, duration, thumbnailUrl } = dto;

    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    // Update media with transcoding results
    await this.prisma.media.update({
      where: { id: mediaId },
      data: {
        width,
        height,
        duration,
        thumbnailUrl,
        transcoded: true,
        url: `${this.s3Endpoint}/${this.s3Bucket}/${key}`,
      },
    });

    return { success: true };
  }

  async findById(id: string) {
    return this.prisma.media.findUnique({
      where: { id },
    });
  }

  async deleteMedia(id: string) {
    // TODO: Delete from S3
    await this.prisma.media.delete({
      where: { id },
    });

    return { success: true };
  }
}
