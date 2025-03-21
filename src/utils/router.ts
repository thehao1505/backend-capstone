import { AuthModule, UserModule } from '@modules'
import { Routes } from '@nestjs/core'

export const routes: Routes = [
  {
    path: 'api/v1',
    children: [
      { path: '/auth', module: AuthModule },
      { path: '/users', module: UserModule },
    ],
  },
]
