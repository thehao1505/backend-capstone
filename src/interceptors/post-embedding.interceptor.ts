import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { RecommendationService } from '@modules/index-service'

@Injectable()
export class PostEmbeddingInterceptor implements NestInterceptor {
  constructor(private readonly recommendationService: RecommendationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async data => {
        // Check if this is a post creation response
        if (data && data._id && data.content) {
          // Enqueue the post for embedding processing
          await this.recommendationService.enqueuePostForEmbedding(data._id.toString())
        }
      }),
    )
  }
}
