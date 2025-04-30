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

  @Get('feed')
  @ApiOperation({ summary: 'Get personalized feed recommendations' })
  async getFeed(@Req() req: Request, @Query('limit') limit = 10) {
    return this.recommendationService.getRecommendationsForUser(req.user['_id'], Number(limit))
  }

  @Get('similar/:postId')
  @ApiOperation({ summary: 'Get similar posts recommendations' })
  async getSimilarPosts(@Param('postId') postId: string, @Query('limit') limit = 10) {
    return this.recommendationService.getSimilarPosts(postId, Number(limit))
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get recommendation system metrics' })
  async getMetrics() {
    return this.recommendationService.getRecommendationMetrics()
  }
}
