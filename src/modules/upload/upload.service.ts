import { Injectable, BadRequestException } from '@nestjs/common'
import { CloudinaryService } from 'nestjs-cloudinary'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFile(file: Express.Multer.File) {
    return await this.cloudinaryService.uploadFile(file, {
      folder: 'avatar',
    })
  }

  async uploadFiles(files: Express.Multer.File[], userId: string): Promise<string[]> {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded')

    const uploadPromises = files.map(file => {
      const fileName = `${userId}_${uuidv4()}`

      return this.cloudinaryService.uploadFile(file, {
        folder: `${userId}`,
        public_id: fileName,
      })
    })

    const results = await Promise.all(uploadPromises)

    return results.map(result => result.secure_url)
  }
}
