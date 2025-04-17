import { Controller, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UploadService } from '@modules/index-service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'

@Controller()
@ApiTags('Upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Req() req: Request) {
    return this.uploadService.uploadFiles(files, req.user['_id'])
  }
}
