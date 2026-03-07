import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
  Res,
  UseGuards,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
import { SubmitLeaveDto } from './dto/submit-leave.dto';
import { ScheduleResponseDto } from './dto/responses/schedule-response.dto';
import { ScheduleListResponseDto } from './dto/responses/schedule-list-response.dto';
import { NotificationListResponseDto } from './dto/responses/notification-response.dto';

@ApiTags('日程管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({ summary: '获取用户的日程列表' })
  @ApiQuery({ name: 'type', enum: ['upcoming', 'history', 'all'], required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ type: ScheduleListResponseDto })
  async getSchedules(
    @Req() req: any,
    @Query('type') type: 'upcoming' | 'history' | 'all' = 'upcoming',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    const result = await this.scheduleService.getUserSchedules(
      userId,
      type,
      page || 1,
      pageSize || 20,
    );
    return {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      items: result.items,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取日程详情' })
  @ApiResponse({ type: ScheduleResponseDto })
  async getSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.getScheduleById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建新日程' })
  @ApiResponse({ type: ScheduleResponseDto })
  async createSchedule(@Req() req: any, @Body() dto: CreateScheduleDto) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    return this.scheduleService.createSchedule(userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新日程信息' })
  @ApiResponse({ type: ScheduleResponseDto })
  async updateSchedule(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
  ) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    return this.scheduleService.updateSchedule(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '取消日程' })
  @ApiResponse({ type: ScheduleResponseDto })
  async cancelSchedule(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    return this.scheduleService.cancelSchedule(id, userId);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: '邀请成员参加活动' })
  @ApiResponse({ type: ScheduleResponseDto })
  async inviteMembers(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InviteMembersDto,
  ) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    return this.scheduleService.inviteMembers(id, userId, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认参加活动' })
  @ApiResponse({ status: 200, description: '确认成功' })
  async confirmParticipation(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    return this.scheduleService.confirmParticipation(id, userId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: '提交请假申请' })
  @ApiResponse({ status: 200, description: '提交成功' })
  async submitLeave(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitLeaveDto,
  ) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    return this.scheduleService.submitLeave(id, userId, dto);
  }

  @Get(':id/leaves')
  @ApiOperation({ summary: '获取请假列表（仅创建者可见）' })
  @ApiResponse({ status: 200, description: '请假列表' })
  async getLeaveRequests(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    return this.scheduleService.getLeaveRequests(id, userId);
  }

  @Get('export/csv')
  @ApiOperation({ summary: '导出日程为 CSV 数据' })
  @ApiQuery({ name: 'type', enum: ['upcoming', 'history'] })
  async exportToCsv(
    @Req() req: any,
    @Query('type') type: 'upcoming' | 'history',
    @Res() res: any,
  ) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    const data = await this.scheduleService.exportToCsv(userId, type);

    // 生成 CSV
    const csv = this.generateCsv(data);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header(
      'Content-Disposition',
      `attachment; filename="schedules_${type}_${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csv);
  }

  @Get('notifications')
  @ApiOperation({ summary: '获取用户的通知列表' })
  @ApiQuery({ name: 'unreadOnly', required: false })
  @ApiResponse({ type: NotificationListResponseDto })
  async getNotifications(
    @Req() req: any,
    @Query('unreadOnly', new ParseBoolPipe({ optional: true })) unreadOnly?: boolean,
  ) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    return this.scheduleService.getUserNotifications(userId, unreadOnly);
  }

  @Post('notifications/:id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAsRead(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userPayload = req.user as JwtPayload;
    const userId = userPayload.sub;
    return this.scheduleService.markNotificationAsRead(id, userId);
  }

  /**
   * 简单的 CSV 生成工具
   */
  private generateCsv(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map((item) =>
      headers
        .map((header) => {
          const value = item[header];
          // 处理包含逗号或引号的字段
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
