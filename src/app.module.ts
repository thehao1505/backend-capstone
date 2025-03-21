import { Module } from '@nestjs/common'
import * as MODULES from '@modules'
import { MongooseModule } from '@nestjs/mongoose'
import * as dotenv from 'dotenv'
import { RouterModule } from '@nestjs/core'
import { routes } from '@utils/router'

dotenv.config()

@Module({
  imports: [MongooseModule.forRoot(process.env.MONGO_URI), RouterModule.register(routes), ...Object.values(MODULES)],
  controllers: [],
  providers: [],
})
export class AppModule {}
