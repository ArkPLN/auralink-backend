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
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserService } from './user.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    if (userPayload.isActive !== user.isActive) {
      throw new UnauthorizedException('令牌状态无效，请重新登录');
    }

    return plainToInstance(
      MeResponseDto,
      {
        id: user.id,
        schoolId: user.schoolId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        department: user.department,
        isActive: user.isActive,
        userRole: user.userRole,
      },
      { excludeExtraneousValues: true },
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取用户列表',
    description:
      '获取活跃用户列表。JWT令牌验证通过后，系统会从数据库查询用户最新角色信息进行权限校验。',
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
    description: '权限不足，仅允许管理员角色且状态为激活的用户访问',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数验证失败',
  })
  @ApiQuery({
    name: 'n',
    required: false,
    description: '返回用户数量限制，默认为10，最大为100',
    example: 10,
  })
  @ApiBody({
    type: FindUsersBodyDto,
    description: '用户身份验证信息',
  })
  @Post('findAll')
  async findAll(
    @Req() req: Request,
    @Query() query: FindUsersQueryDto,
    @Body() bodyDto: FindUsersBodyDto,
  ): Promise<FindUsersResponseDto> {
    const jwtPayload = req['user'] as JwtPayload;
    const userId = jwtPayload.sub;

    const currentUser = await this.userService.findOneById(userId);

    if (!currentUser) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: '用户不存在或已被删除',
        error: 'Unauthorized',
      });
    }

    if (!currentUser.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    if (jwtPayload.isActive !== currentUser.isActive) {
      throw new UnauthorizedException('令牌状态无效，请重新登录');
    }

    if (
      (currentUser.userRole !== 'admin' && currentUser.userRole !== 'root') ||
      !currentUser.isActive
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        message: '权限不足，仅允许管理员角色且状态为激活的用户访问',
        error: 'Forbidden',
      });
    }

    const limit = query.n ?? 10;
    const users = await this.userService.findActiveUsers(limit);

    const publicUsers = plainToInstance(
      PublicUserDto,
      users.map((u) => ({
        id: u.id,
        schoolId: u.schoolId,
        name: u.name,
        phone: u.phone,
        email: u.email,
        department: u.department,
        userRole: u.userRole,
        isActive: u.isActive,
      })),
      { excludeExtraneousValues: true },
    );

    return {
      users: publicUsers,
      count: publicUsers.length,
      limit,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    const userPayload = req['user'] as JwtPayload;
    const userId = userPayload.sub;

    const currentUser = await this.userService.findOneById(userId);
    if (!currentUser) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!currentUser.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    if (userPayload.isActive !== currentUser.isActive) {
      throw new UnauthorizedException('令牌状态无效，请重新登录');
    }

    const updatedUser = await this.userService.updateUser(
      userId,
      updateUserDto,
      userId,
    );

    return plainToInstance(
      MeResponseDto,
      {
        id: updatedUser.id,
        schoolId: updatedUser.schoolId,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        department: updatedUser.department,
        isActive: updatedUser.isActive,
        userRole: updatedUser.userRole,
      },
      { excludeExtraneousValues: true },
    );
  }
}
