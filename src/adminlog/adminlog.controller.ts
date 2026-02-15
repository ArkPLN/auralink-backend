import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminlogService } from './adminlog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt';
import { UserService } from '../user/user.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../user/entities/user.entity';
import { AdminLog, AdminActionType } from './entities/adminlog.entity';
import { QueryAdminLogDto, AdminLogListResponseDto } from './dto/adminlog.dto';
import {
  UpdateUserByAdminDto,
  BatchUpdateDto,
  BatchDeleteDto,
  CreateAdminDto,
  UpdateAdminDto,
  DeleteAdminDto,
  AdminListResponseDto,
  AdminResponseDto,
  BatchOperationResultDto,
} from './dto/admin-user.dto';
import * as bcrypt from 'bcrypt';

@ApiTags('管理员操作日志')
@Controller('admin')
export class AdminlogController {
  constructor(
    private readonly adminlogService: AdminlogService,
    private readonly userService: UserService,
    private readonly em: EntityManager,
  ) {}

  private async checkAdminPermission(req: Request): Promise<User> {
    const userPayload = req['user'] as JwtPayload;
    const user = await this.userService.findOneById(userPayload.sub);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    if (user.userRole !== 'admin' && user.userRole !== 'root') {
      throw new ForbiddenException('权限不足，仅允许管理员访问');
    }

    return user;
  }

  private getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return (req as any).socket?.remoteAddress || 'unknown';
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('log')
  @ApiOperation({ summary: '查询管理员操作日志' })
  @ApiResponse({
    status: 200,
    description: '返回操作日志列表',
    type: AdminLogListResponseDto,
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getLogs(
    @Req() req: Request,
    @Query() query: QueryAdminLogDto,
  ): Promise<AdminLogListResponseDto> {
    await this.checkAdminPermission(req);
    return this.adminlogService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: '更新单个用户信息' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updateUser(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserByAdminDto,
  ): Promise<{ message: string }> {
    const operator = await this.checkAdminPermission(req);
    const ipAddress = this.getIpAddress(req);

    const targetUser = await this.userService.findOneById(id);
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    const oldValues: Record<string, string> = {};
    const newValues: Record<string, string> = {};

    for (const [key, value] of Object.entries(updateDto)) {
      if (value !== undefined) {
        oldValues[key] = String((targetUser as any)[key]);
        newValues[key] = String(value);
      }
    }

    await this.userService.update(id, updateDto);

    for (const [key, value] of Object.entries(updateDto)) {
      if (value !== undefined) {
        const actionType =
          key === 'userRole'
            ? AdminActionType.CHANGE_ROLE
            : key === 'isActive'
              ? AdminActionType.TOGGLE_STATUS
              : AdminActionType.UPDATE_INFO;

        await this.adminlogService.createLog({
          operatorId: operator.id,
          targetId: id,
          actionType,
          fieldName: key,
          oldValue: oldValues[key],
          newValue: newValues[key],
          ipAddress,
        });
      }
    }

    return { message: '更新成功' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('batch')
  @ApiOperation({ summary: '批量更新用户信息' })
  @ApiResponse({
    status: 200,
    description: '批量更新结果',
    type: BatchOperationResultDto,
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async batchUpdateUsers(
    @Req() req: Request,
    @Body() batchDto: BatchUpdateDto,
  ): Promise<BatchOperationResultDto> {
    const operator = await this.checkAdminPermission(req);
    const ipAddress = this.getIpAddress(req);

    let success = 0;
    let failed = 0;
    const failures: { id: number; reason: string }[] = [];

    for (const item of batchDto.users) {
      try {
        const targetUser = await this.userService.findOneById(item.id);
        if (!targetUser) {
          failed++;
          failures.push({ id: item.id, reason: '用户不存在' });
          continue;
        }

        const oldValues: Record<string, string> = {};
        const newValues: Record<string, string> = {};

        for (const [key, value] of Object.entries(item.updates)) {
          if (value !== undefined) {
            oldValues[key] = String((targetUser as any)[key]);
            newValues[key] = String(value);
          }
        }

        await this.userService.update(item.id, item.updates);
        success++;

        for (const [key, value] of Object.entries(item.updates)) {
          if (value !== undefined) {
            const actionType =
              key === 'userRole'
                ? AdminActionType.CHANGE_ROLE
                : key === 'isActive'
                  ? AdminActionType.TOGGLE_STATUS
                  : AdminActionType.UPDATE_INFO;

            await this.adminlogService.createLog({
              operatorId: operator.id,
              targetId: item.id,
              actionType,
              fieldName: key,
              oldValue: oldValues[key],
              newValue: newValues[key],
              ipAddress,
            });
          }
        }
      } catch (error) {
        failed++;
        failures.push({ id: item.id, reason: (error as Error).message });
      }
    }

    await this.adminlogService.createLog({
      operatorId: operator.id,
      actionType: AdminActionType.BATCH_UPDATE,
      details: `批量更新 ${success} 个用户，失败 ${failed} 个`,
      ipAddress,
    });

    return {
      success,
      failed,
      failures: failures.length > 0 ? failures : undefined,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('batch')
  @ApiOperation({ summary: '批量删除用户' })
  @ApiResponse({
    status: 200,
    description: '批量删除结果',
    type: BatchOperationResultDto,
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async batchDeleteUsers(
    @Req() req: Request,
    @Body() batchDto: BatchDeleteDto,
  ): Promise<BatchOperationResultDto> {
    const operator = await this.checkAdminPermission(req);
    const ipAddress = this.getIpAddress(req);

    if (operator.userRole !== 'root') {
      throw new ForbiddenException('仅root用户可以删除用户');
    }

    let success = 0;
    let failed = 0;
    const failures: { id: number; reason: string }[] = [];

    for (const id of batchDto.ids) {
      try {
        const targetUser = await this.userService.findOneById(id);
        if (!targetUser) {
          failed++;
          failures.push({ id, reason: '用户不存在' });
          continue;
        }

        if (targetUser.userRole === 'root') {
          failed++;
          failures.push({ id, reason: '不能删除root用户' });
          continue;
        }

        await this.em.nativeDelete(User, { id });
        success++;

        await this.adminlogService.createLog({
          operatorId: operator.id,
          targetId: id,
          actionType: AdminActionType.TOGGLE_STATUS,
          details: `删除用户 ${targetUser.schoolId}`,
          ipAddress,
        });
      } catch (error) {
        failed++;
        failures.push({ id, reason: (error as Error).message });
      }
    }

    await this.adminlogService.createLog({
      operatorId: operator.id,
      actionType: AdminActionType.BATCH_UPDATE,
      details: `批量删除 ${success} 个用户，失败 ${failed} 个`,
      ipAddress,
    });

    return {
      success,
      failed,
      failures: failures.length > 0 ? failures : undefined,
    };
  }
}

@ApiTags('管理员权限管理')
@Controller('user/admin')
export class AdminUserController {
  constructor(
    private readonly userService: UserService,
    private readonly em: EntityManager,
    private readonly adminlogService: AdminlogService,
  ) {}

  private async checkRootPermission(req: Request): Promise<User> {
    const userPayload = req['user'] as JwtPayload;
    const user = await this.userService.findOneById(userPayload.sub);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    return user;
  }

  private getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return (req as any).socket?.remoteAddress || 'unknown';
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
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
  @Post()
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
  @Put()
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
  @Delete()
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
