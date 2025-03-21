import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from '@entities'
import { CreateUserDto, UpdateUserDto, QueryDto } from '@dtos/user.dto'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async getUsers(queryDto: QueryDto) {
    return await this.userModel.find().limit(queryDto.limit).skip(queryDto.page).lean()
  }

  async getUser(id: string) {
    return await this.userModel.findById(id)
  }

  async createUser(createUserDto: CreateUserDto) {
    return await this.userModel.create(createUserDto)
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    return await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true })
  }

  async deleteUser(id: string) {
    return await this.userModel.findByIdAndDelete(id)
  }

  async doSomeTask(id: string, score: number) {
    await this.userModel.findByIdAndUpdate(id, { $inc: { score: score } }, { new: true })
    return await this.userModel.find().limit(10).sort({ score: 1 }).lean()
  }
}
