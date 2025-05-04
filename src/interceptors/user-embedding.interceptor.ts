import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { UserService } from '@modules/index-service'

@Injectable()
export class UserEmbeddingInterceptor implements NestInterceptor {
  constructor(private readonly userService: UserService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async data => {
        if (data && data._id) {
          await this.userService.enqueueUserForEmbedding(data._id.toString())
        }
      }),
    )
  }
}
