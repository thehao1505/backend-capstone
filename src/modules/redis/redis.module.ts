import { Module } from '@nestjs/common'
import { RedisService } from '@modules/index-service'
import { BullModule } from '@nestjs/bullmq'
import { configs } from '@utils/configs'

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: configs.redisHost,
        port: Number(configs.redisPort),
      },
    }),
    BullModule.registerQueue({
      name: 'embedding',
    }),
  ],
  providers: [RedisService],
  exports: [RedisService, BullModule],
})
export class RedisModule {}
