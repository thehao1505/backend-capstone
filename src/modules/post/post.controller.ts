import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PostService } from '@modules/index-service'

@Controller()
@ApiTags('Post')
export class PostController {
  constructor(private readonly postService: PostService) {}
}
