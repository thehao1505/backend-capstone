import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { RecommendationService } from '@modules/index-service'

@Injectable()
export class PostEmbeddingInterceptor implements NestInterceptor {
  constructor(private readonly recommendationService: RecommendationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async data => {
        if (data && data._id && (data.content || data.images.length > 0)) {
          await this.recommendationService.enqueuePostForEmbedding(data._id.toString())
        }
      }),
    )
  }
}
