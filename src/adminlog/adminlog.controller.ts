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
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AdminlogService } from './adminlog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt';
import { UserService } from '../user/user.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../user/entities/user.entity';
import { AdminActionType } from './entities/adminlog.entity';
import { QueryAdminLogDto, AdminLogListResponseDto } from './dto/adminlog.dto';
import {
  UpdateUserByAdminDto,
  BatchUpdateDto,
  BatchDeleteDto,
  BatchOperationResultDto,
} from './dto/admin-user.dto';

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
  @ApiOperation({
    summary: '查询管理员操作日志',
    description:
      '分页查询管理员操作日志，支持按操作类型、时间范围、操作用户ID等条件筛选。仅管理员和root用户可访问。',
  })
  @ApiResponse({
    status: 200,
    description:
      '返回操作日志列表，包含操作人、被操作用户、操作类型、修改前后值等信息',
    type: AdminLogListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '未授权或令牌无效',
    schema: {
      examples: {
        userNotFound: {
          summary: '用户不存在',
          value: {
            statusCode: 401,
            message: '用户不存在',
            error: 'Unauthorized',
          },
        },
        accountDisabled: {
          summary: '账号已禁用',
          value: {
            statusCode: 401,
            message: '账号已被禁用',
            error: 'Unauthorized',
          },
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: '权限不足，仅允许管理员访问',
    schema: {
      example: {
        statusCode: 403,
        message: '权限不足，仅允许管理员访问',
        error: 'Forbidden',
      },
    },
  })
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
  @ApiOperation({
    summary: '更新单个用户信息',
    description:
      '管理员更新指定用户的信息。可修改的字段包括姓名、手机、邮箱、部门、激活状态、角色等。每次修改都会记录操作日志，包含修改前后的值。',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    schema: {
      example: {
        message: '更新成功',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: '未授权',
  })
  @ApiForbiddenResponse({
    description: '权限不足',
    schema: {
      example: {
        statusCode: 403,
        message: '权限不足，仅允许管理员访问',
        error: 'Forbidden',
      },
    },
  })
  @ApiNotFoundResponse({
    description: '用户不存在',
    schema: {
      example: {
        statusCode: 404,
        message: '用户不存在',
        error: 'NotFound',
      },
    },
  })
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
  @ApiOperation({
    summary: '批量更新用户信息',
    description:
      '批量更新多个用户的信息。每个用户的更新操作都会单独记录日志。返回成功和失败的数量及详情。',
  })
  @ApiResponse({
    status: 200,
    description: '批量更新结果，包含成功数量、失败数量和失败详情',
    type: BatchOperationResultDto,
  })
  @ApiUnauthorizedResponse({
    description: '未授权',
  })
  @ApiForbiddenResponse({
    description: '权限不足',
    schema: {
      example: {
        statusCode: 403,
        message: '权限不足，仅允许管理员访问',
        error: 'Forbidden',
      },
    },
  })
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
  @ApiOperation({
    summary: '批量删除用户',
    description:
      '批量删除多个用户账户。仅root用户可操作，且不能删除root用户。每个删除操作都会单独记录日志。',
  })
  @ApiResponse({
    status: 200,
    description: '批量删除结果，包含成功数量、失败数量和失败详情',
    type: BatchOperationResultDto,
  })
  @ApiUnauthorizedResponse({
    description: '未授权',
  })
  @ApiForbiddenResponse({
    description: '权限不足或尝试删除root用户',
    schema: {
      examples: {
        notRoot: {
          summary: '非root用户',
          value: {
            statusCode: 403,
            message: '仅root用户可以删除用户',
            error: 'Forbidden',
          },
        },
        cannotDeleteRoot: {
          summary: '不能删除root用户',
          value: {
            id: 1,
            reason: '不能删除root用户',
          },
        },
      },
    },
  })
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
