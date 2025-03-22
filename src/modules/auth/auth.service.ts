import { User } from '@entities'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { AuthDto, ResetPasswordDto, ChangePasswordDto } from '@dtos/auth.dto'
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

  async register(authDto: AuthDto) {
    try {
      const user = await this.userModel.create(authDto)
      delete user.password

      return await this.signJwtToken(user._id, user.email)
    } catch (error) {
      console.log(error)
    }
  }

  async login(authDto: AuthDto) {
    const user = await this.userModel.findOne({ email: authDto.email })
    if (!user) throw new ForbiddenException('User not found')

    const isRightPassword = await bcrypt.compare(authDto.password, user.password)
    if (!isRightPassword) throw new ForbiddenException('Wrong password!')

    delete user.password
    return await this.signJwtToken(user.id, user.email)
  }

  async signJwtToken(id: string, email: string): Promise<{ accessToken: string }> {
    const payload = { sub: id, email }
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
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await user.save()

    try {
      const resetUrl = `${configs.url}auth/reset-password/${resetToken}`
      return await this.mailService.sendMail(email, 'Reset Password', `${resetUrl}`)
    } catch (error) {
      console.log(error)
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, token: string) {
    if (resetPasswordDto.password !== resetPasswordDto.passwordConfirm)
      throw new ForbiddenException('Password and confirm password do not match!')

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
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

    return this.signJwtToken(user._id, user.email)
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

    return this.signJwtToken(user._id, user.email)
  }
}
