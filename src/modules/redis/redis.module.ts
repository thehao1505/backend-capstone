import { Module } from '@nestjs/common'
import { RedisService } from '@modules/index-service'

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
