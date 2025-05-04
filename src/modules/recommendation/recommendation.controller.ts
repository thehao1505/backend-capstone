import { QueryRecommendationDto, QuerySearchDto } from '@dtos/recommendation.dto'
import { RecommendationService } from '@modules/index-service'
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { Request } from 'express'

@Controller()
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Recommendation')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('for-your-page')
  @ApiOperation({ summary: 'Get personalized feed recommendations' })
  async getFeed(@Req() req: Request, @Query() query: QueryRecommendationDto) {
    return this.recommendationService.getRecommendationsForUser(req.user['_id'], query)
  }

  @Get('following')
  @ApiOperation({ summary: 'Get following recommendations' })
  async getFollowing(@Req() req: Request, @Query() query: QueryRecommendationDto) {
    return this.recommendationService.getFollowingRecommendations(req.user['_id'], query)
  }

  @Get('similar/:postId')
  @ApiOperation({ summary: 'Get similar posts recommendations' })
  async getSimilarPosts(@Param('postId') postId: string, @Query() query: QueryRecommendationDto) {
    return this.recommendationService.getSimilarPosts(postId, query)
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get recommendation system metrics' })
  async getMetrics() {
    return this.recommendationService.getRecommendationMetrics()
  }

  @Get('search')
  @ApiOperation({ summary: 'Get recommendation system metrics' })
  async search(@Query() query: QuerySearchDto) {
    return this.recommendationService.search(query)
  }
}
