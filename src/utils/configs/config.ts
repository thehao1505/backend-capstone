import { config } from 'dotenv'

switch (process.env.NODE_ENV) {
  case 'development':
    config({ path: '.env.local' })
    break
  default:
    config({ path: '.env' })
    break
}

export const configs = {
  port: process.env.PORT,
  mongoUri: process.env.MONGO_URI,
  mailUser: process.env.MAIL_USER,
  mailPassword: process.env.MAIL_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  url: process.env.URL,

  // Upload cloudinary
  cloudinaryName: process.env.CLOUDINARY_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // Redis
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  redisLikesTtl: process.env.REDIS_LIKES_TTL,

  defaultAvatar: process.env.DEFAULT_AVATAR || 'http://res.cloudinary.com/thehao/image/upload/v1742720328/img/zu8ppzlb07gwtweuwpfq.jpg',
}
