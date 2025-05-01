import { User } from '@entities'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { AuthDto, ResetPasswordDto, ChangePasswordDto, RegisterDto } from '@dtos/auth.dto'
import { configs } from '@utils/configs'
import * as crypto from 'crypto'
import { MailService } from '@modules/index-service'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    if (!registerDto.username && !registerDto.email) throw new ForbiddenException('Username or email is required!')

    const existingUser = await this.userModel.findOne({ email: registerDto.email }).lean()
    if (existingUser) throw new ForbiddenException('Email already exists!')

    const user = (await this.userModel.create(registerDto)).toObject()
    delete user.password

    const { _id, avatar, email, fullName, username } = user
    const token = await this.signJwtToken(user._id, email)

    return {
      user: { _id, avatar, email, fullName, username },
      token,
    }
  }

  async login(authDto: AuthDto) {
    if (!authDto.username && !authDto.email) throw new ForbiddenException('Username or email is required!')

    const user = await this.userModel.findOne({ $or: [{ email: authDto.email }, { username: authDto.username }] }).lean()
    if (!user) throw new ForbiddenException('User not found')

    const isRightPassword = await bcrypt.compare(authDto.password, user.password)
    if (!isRightPassword) throw new ForbiddenException('Wrong password!')

    const { _id, avatar, email, fullName, username } = user
    const token = await this.signJwtToken(user._id, email)

    return {
      user: { _id, avatar, email, fullName, username },
      token,
    }
  }

  async signJwtToken(id: string, email: string): Promise<{ accessToken: string }> {
    const payload = { _id: id, email }
    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: configs.jwtSecret,
    })

    return { accessToken: jwtString }
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email })
    if (!user) throw new ForbiddenException('Invalid email!')

    const resetToken = crypto.randomBytes(32).toString('hex')
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    try {
      const resetUrl = `${configs.nextAppUrl}/reset-password/${resetToken}`
      return await this.mailService.sendMail(email, 'Reset Password', `${resetUrl}`)
    } catch (error) {
      throw new ForbiddenException('Failed to send reset password email!')
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, resetToken: string) {
    if (resetPasswordDto.password !== resetPasswordDto.passwordConfirm)
      throw new ForbiddenException('Password and confirm password do not match!')

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const user = await this.userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })
    if (!user) throw new ForbiddenException('Invalid or expired token!')

    user.password = resetPasswordDto.password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.passwordChangeAt = new Date()
    await user.save()

    const { _id, avatar, email, fullName, username } = user
    const token = await this.signJwtToken(user._id, email)

    return {
      user: { _id, avatar, email, fullName, username },
      token,
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findById(id)
    if (!user) throw new ForbiddenException('User not found!')

    const isRightPassword = await bcrypt.compare(changePasswordDto.currentPassword, user.password)
    if (!isRightPassword) throw new ForbiddenException('Wrong current password!')

    if (changePasswordDto.newPassword !== changePasswordDto.newPasswordConfirm)
      throw new ForbiddenException('Password and confirm password do not match!')

    user.password = changePasswordDto.newPassword
    user.passwordChangeAt = new Date()
    await user.save()

    const { _id, avatar, email, fullName, username } = user
    const token = await this.signJwtToken(user._id, email)

    return {
      user: { _id, avatar, email, fullName, username },
      token,
    }
  }
}
