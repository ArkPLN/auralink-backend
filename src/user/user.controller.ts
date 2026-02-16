import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Req,
  UnauthorizedException,
  UseGuards,
  Query,
  ForbiddenException,
  Body,
  NotFoundException,
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
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from './entities/user.entity';
import { AdminlogService } from '../adminlog/adminlog.service';
import { AdminActionType } from '../adminlog/entities/adminlog.entity';
import {
  CreateAdminDto,
  UpdateAdminDto,
  DeleteAdminDto,
  AdminListResponseDto,
  AdminResponseDto,
} from '../adminlog/dto/admin-user.dto';
import * as bcrypt from 'bcrypt';

@ApiTags('用户模块')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly em: EntityManager,
    private readonly adminlogService: AdminlogService,
  ) {}

  private getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return (req as any).socket?.remoteAddress || 'unknown';
  }

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

  private async checkRootPermission(req: Request): Promise<User> {
    const userPayload = req['user'] as JwtPayload;
    const user = await this.userService.findOneById(userPayload.sub);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    if (user.userRole !== 'root') {
      throw new ForbiddenException('权限不足，仅允许root用户访问');
    }

    return user;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('admin')
  @ApiOperation({ summary: '获取所有管理员列表' })
  @ApiResponse({
    status: 200,
    description: '返回管理员列表',
    type: AdminListResponseDto,
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getAdmins(@Req() req: Request): Promise<AdminListResponseDto> {
    await this.checkRootPermission(req);

    const admins = await this.em.find(
      User,
      { userRole: { $in: ['admin', 'root'] } },
      { orderBy: { createdAt: 'DESC' } },
    );

    const adminResponses: AdminResponseDto[] = admins.map((admin) => ({
      id: admin.id,
      schoolId: admin.schoolId,
      name: admin.name ?? '',
      phone: admin.phone ?? '',
      email: admin.email ?? '',
      department: admin.department,
      userRole: admin.userRole,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    }));

    return {
      admins: adminResponses,
      total: adminResponses.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('admin')
  @ApiOperation({ summary: '新增管理员账户' })
  @ApiResponse({ status: 201, description: '创建成功', type: AdminResponseDto })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async createAdmin(
    @Req() req: Request,
    @Body() createDto: CreateAdminDto,
  ): Promise<AdminResponseDto> {
    const operator = await this.checkRootPermission(req);
    const ipAddress = this.getIpAddress(req);

    const existingUser = await this.userService.findOneBySchoolId(
      createDto.schoolId,
    );
    if (existingUser) {
      throw new ForbiddenException('该学号已存在');
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    const user = new User();
    user.schoolId = createDto.schoolId;
    user.password = hashedPassword;
    user.name = createDto.name;
    user.phone = createDto.phone;
    user.email = createDto.email;
    user.department = createDto.department ?? 'admin';
    user.userRole = createDto.userRole ?? 'admin';
    user.isActive = true;

    await this.em.persistAndFlush(user);

    await this.adminlogService.createLog({
      operatorId: operator.id,
      targetId: user.id,
      actionType: AdminActionType.CHANGE_ROLE,
      details: `创建管理员账户: ${user.schoolId}`,
      ipAddress,
    });

    return {
      id: user.id,
      schoolId: user.schoolId,
      name: user.name ?? '',
      phone: user.phone ?? '',
      email: user.email ?? '',
      department: user.department,
      userRole: user.userRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('admin')
  @ApiOperation({ summary: '更新管理员信息' })
  @ApiResponse({ status: 200, description: '更新成功', type: AdminResponseDto })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '管理员不存在' })
  async updateAdmin(
    @Req() req: Request,
    @Body() updateDto: UpdateAdminDto,
  ): Promise<AdminResponseDto> {
    const operator = await this.checkRootPermission(req);
    const ipAddress = this.getIpAddress(req);

    const targetUser = await this.userService.findOneById(updateDto.id);
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    if (targetUser.userRole !== 'admin' && targetUser.userRole !== 'root') {
      throw new ForbiddenException('目标用户不是管理员');
    }

    const oldValues: Record<string, string> = {};
    const newValues: Record<string, string> = {};

    for (const [key, value] of Object.entries(updateDto.updates)) {
      if (value !== undefined) {
        oldValues[key] = String((targetUser as any)[key]);
        newValues[key] = String(value);
      }
    }

    await this.userService.update(updateDto.id, updateDto.updates);

    for (const [key, value] of Object.entries(updateDto.updates)) {
      if (value !== undefined) {
        const actionType =
          key === 'userRole'
            ? AdminActionType.CHANGE_ROLE
            : key === 'isActive'
              ? AdminActionType.TOGGLE_STATUS
              : AdminActionType.UPDATE_INFO;

        await this.adminlogService.createLog({
          operatorId: operator.id,
          targetId: updateDto.id,
          actionType,
          fieldName: key,
          oldValue: oldValues[key],
          newValue: newValues[key],
          ipAddress,
        });
      }
    }

    const updatedUser = await this.userService.findOneById(updateDto.id);
    return {
      id: updatedUser!.id,
      schoolId: updatedUser!.schoolId,
      name: updatedUser!.name ?? '',
      phone: updatedUser!.phone ?? '',
      email: updatedUser!.email ?? '',
      department: updatedUser!.department,
      userRole: updatedUser!.userRole,
      isActive: updatedUser!.isActive,
      createdAt: updatedUser!.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('admin')
  @ApiOperation({ summary: '删除管理员账户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '管理员不存在' })
  async deleteAdmin(
    @Req() req: Request,
    @Body() deleteDto: DeleteAdminDto,
  ): Promise<{ message: string }> {
    const operator = await this.checkRootPermission(req);
    const ipAddress = this.getIpAddress(req);

    const targetUser = await this.userService.findOneById(deleteDto.id);
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    if (targetUser.userRole !== 'admin') {
      throw new ForbiddenException('只能删除普通管理员，不能删除root用户');
    }

    await this.adminlogService.createLog({
      operatorId: operator.id,
      targetId: deleteDto.id,
      actionType: AdminActionType.TOGGLE_STATUS,
      details: `删除管理员账户: ${targetUser.schoolId}`,
      ipAddress,
    });

    await this.em.nativeDelete(User, { id: deleteDto.id });

    return { message: '删除成功' };
  }
}
