import { Module } from '@nestjs/common'
import * as MODULES from '@modules'
import { MongooseModule } from '@nestjs/mongoose'
import { RouterModule } from '@nestjs/core'
import { routes } from '@utils/router'
import { configs } from '@utils/configs'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [ScheduleModule.forRoot(), MongooseModule.forRoot(configs.mongoUri), RouterModule.register(routes), ...Object.values(MODULES)],
  controllers: [],
  providers: [],
})
export class AppModule {}
