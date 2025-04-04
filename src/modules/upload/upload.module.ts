import { Module } from '@nestjs/common'
import { configs } from '@utils/configs'
import { UploadService } from './upload.service'
import { CloudinaryModule } from 'nestjs-cloudinary'
import { UploadController } from './upload.controller'

@Module({
  imports: [
    CloudinaryModule.forRootAsync({
      useFactory: () => ({
        isGlobal: true,
        cloud_name: configs.cloudinaryName,
        api_key: configs.cloudinaryApiKey,
        api_secret: configs.cloudinaryApiSecret,
      }),
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
