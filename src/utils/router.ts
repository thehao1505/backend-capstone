import { AuthModule, UserModule, PostModule, UploadModule, CommentModule, MessageModule } from '@modules'
import { Routes } from '@nestjs/core'

export const routes: Routes = [
  {
    path: 'api/v1',
    children: [
      { path: '/auth', module: AuthModule },
      { path: '/users', module: UserModule },
      { path: '/posts', module: PostModule },
      { path: '/upload', module: UploadModule },
      { path: '/comment', module: CommentModule },
      { path: '/message', module: MessageModule },
    ],
  },
]
