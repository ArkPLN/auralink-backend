import {
  Controller,
  Get,
  Put,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  Query,
  ForbiddenException,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserService } from './user.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  FindUsersQueryDto,
  FindUsersBodyDto,
  FindUsersResponseDto,
} from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from 'src/auth/strategies/jwt';
import { MeResponseDto, PublicUserDto } from './dto/user-response.dto';

@ApiTags('用户模块')
@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '返回用户信息，不包含密码',
    type: MeResponseDto,
  })
  @Get('me')
  async getMe(@Req() req: Request): Promise<MeResponseDto> {
    const userPayload = req['user'] as JwtPayload;
    const user = await this.userService.findOneBySchoolId(userPayload.schoolId);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 使用 plainToInstance 转换为 DTO，自动剔除多余字段
    return plainToInstance(MeResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '获取用户列表',
    description:
      '获取活跃用户列表。需要双重身份验证：JWT令牌和请求体中的用户信息必须一致。',
  })
  @ApiResponse({
    status: 200,
    description: '返回前n个活跃用户信息',
    type: FindUsersResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT令牌无效或已过期',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，仅允许userRole为admin且isActive=true的用户访问',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数验证失败或用户信息不匹配',
  })
  @ApiQuery({
    name: 'n',
    required: false,
    description: '返回用户数量限制，默认为10，最大为100',
    example: 10,
  })
  @ApiBody({
    type: FindUsersBodyDto,
    description: '用户身份验证信息（必须与JWT令牌中的信息一致）',
  })
  @Post('findAll')
  async findAll(
    @Req() req: Request,
    @Query() query: FindUsersQueryDto,
    @Body() bodyDto: FindUsersBodyDto,
  ): Promise<FindUsersResponseDto> {
    const currentUser = req['user'] as JwtPayload;

    if (currentUser.userRole !== 'admin' || !currentUser.isActive) {
      throw new ForbiddenException({
        statusCode: 403,
        message: '权限不足，仅允许userRole为admin且isActive=true的用户访问',
        error: 'Forbidden',
      });
    }

    if (
      currentUser.sub !== bodyDto.id ||
      currentUser.role !== bodyDto.userRole
    ) {
      throw new UnauthorizedException({
        statusCode: 400,
        message: '用户信息不匹配，JWT令牌与请求体中的用户信息不一致',
        error: 'BadRequest',
      });
    }

    const limit = query.n ?? 10;
    const users = await this.userService.findActiveUsers(limit);

    // 转换为 PublicUserDto，只保留公开字段
    const publicUsers = plainToInstance(PublicUserDto, users, {
      excludeExtraneousValues: true,
    });

    return {
      users: publicUsers,
      count: publicUsers.length,
      limit,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({
    status: 200,
    description: '用户信息更新成功，返回更新后的用户信息',
    type: MeResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，只能更新自己的信息',
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: '用户更新信息（不包含密码）',
  })
  @Put('update')
  async updateUser(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<MeResponseDto> {
    const currentUser = req['user'] as JwtPayload;
    const userId = currentUser.sub;

    const updatedUser = await this.userService.updateUser(
      userId,
      updateUserDto,
      userId,
    );

    // 转换为 MeResponseDto
    return plainToInstance(MeResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }
}
