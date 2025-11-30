import { Module } from '@nestjs/common';
import { FeedsController } from './feeds.controller';
import { FeedsService } from './feeds.service';
import { RankingService } from './ranking.service';

@Module({
  controllers: [FeedsController],
  providers: [FeedsService, RankingService],
  exports: [FeedsService, RankingService],
})
export class FeedsModule {}
