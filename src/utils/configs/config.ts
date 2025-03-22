import { config } from 'dotenv'

config({ path: '.env' })

export const configs = {
  port: process.env.PORT,
  mongoUri: process.env.MONGO_URI,
  mailUser: process.env.MAIL_USER,
  mailPassword: process.env.MAIL_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
  url: process.env.URL,

  // defaultAvatar: process.env.DEFAULT_AVATAR || "link"
}
