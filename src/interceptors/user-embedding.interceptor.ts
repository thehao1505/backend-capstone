import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { UserService } from '@modules/index-service'

@Injectable()
export class UserEmbeddingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UserEmbeddingInterceptor.name)
  constructor(private readonly userService: UserService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async data => {
        if (data && (data._id || data.user._id)) {
          await this.userService.enqueueUserForEmbedding(data._id?.toString() || data.user._id.toString())
        }
      }),
    )
  }
}
