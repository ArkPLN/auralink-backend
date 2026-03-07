import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Schedule, ScheduleParticipant, ParticipantStatus, ScheduleStatus } from './entities/schedule.entity';
import { ScheduleAttachment } from './entities/schedule-attachment.entity';
import { ScheduleNotification, NotificationType } from './entities/schedule-notification.entity';
import { User } from '../user/entities/user.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
import { SubmitLeaveDto } from './dto/submit-leave.dto';
import { ScheduleResponseDto } from './dto/responses/schedule-response.dto';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly em: EntityManager,
    private readonly orm: MikroORM,
  ) {}

  /**
   * 将 Schedule entity 转换为响应 DTO，避免循环引用
   */
  private toResponseDto(schedule: Schedule): ScheduleResponseDto {
    const participants = schedule.participants.getItems();

    return {
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      location: schedule.location,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      creator: {
        id: schedule.creator.id,
        schoolId: schedule.creator.schoolId,
        name: schedule.creator.name,
        phone: schedule.creator.phone,
        email: schedule.creator.email,
        department: schedule.creator.department,
        position: schedule.creator.position,
        qqNumber: schedule.creator.qqNumber,
        isActive: schedule.creator.isActive,
        userRole: schedule.creator.userRole,
        avatarUrl: schedule.creator.avatarUrl,
        createdAt: schedule.creator.createdAt,
        updatedAt: schedule.creator.updatedAt,
      },
      status: schedule.status,
      maxParticipants: schedule.maxParticipants,
      currentParticipants: participants.length,
      attachments: schedule.attachments.getItems().map(a => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileSize: a.fileSize,
        fileType: a.fileType,
      })),
      participants: participants.map(p => ({
        id: p.id,
        user: {
          id: p.user.id,
          schoolId: p.user.schoolId,
          name: p.user.name,
          phone: p.user.phone,
          email: p.user.email,
          department: p.user.department,
          position: p.user.position,
          qqNumber: p.user.qqNumber,
          isActive: p.user.isActive,
          userRole: p.user.userRole,
          avatarUrl: p.user.avatarUrl,
          createdAt: p.user.createdAt,
          updatedAt: p.user.updatedAt,
        },
        status: p.status,
        leaveReason: p.leaveReason,
        leaveTime: p.leaveTime,
        invitedAt: p.invitedAt,
      })),
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  /**
   * 创建日程
   */
  async createSchedule(userId: number, dto: CreateScheduleDto): Promise<ScheduleResponseDto> {
    const creator = await this.em.findOne(User, { id: userId });
    if (!creator) {
      throw new NotFoundException('用户不存在');
    }

    const schedule = new Schedule();
    schedule.title = dto.title;
    schedule.description = dto.description;
    schedule.location = dto.location;
    schedule.startTime = new Date(dto.startTime);
    schedule.endTime = new Date(dto.endTime);
    schedule.maxParticipants = dto.maxParticipants;
    schedule.creator = creator;
    schedule.status = ScheduleStatus.ACTIVE;

    await this.em.persistAndFlush(schedule);

    // 关联附件
    if (dto.attachmentIds && dto.attachmentIds.length > 0) {
      for (const attachmentId of dto.attachmentIds) {
        const attachment = await this.em.findOne(ScheduleAttachment, { id: attachmentId });
        if (attachment) {
          attachment.schedule = schedule;
        }
      }
      await this.em.flush();
    }

    // 邀请成员
    if (dto.inviteeIds && dto.inviteeIds.length > 0) {
      await this.inviteMembersInternal(schedule, dto.inviteeIds);
    }

    // 重新加载以获取关联数据
    await this.em.populate(schedule, ['creator', 'participants.user', 'attachments']);
    return this.toResponseDto(schedule);
  }

  /**
   * 获取日程详情
   */
  async getScheduleById(id: number): Promise<ScheduleResponseDto> {
    const schedule = await this.em.findOne(Schedule, { id }, {
      populate: ['creator', 'participants.user', 'attachments'],
    });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }
    return this.toResponseDto(schedule);
  }

  /**
   * 获取用户的日程列表
   */
  async getUserSchedules(
    userId: number,
    type: 'upcoming' | 'history' | 'all',
    page: number = 1,
    pageSize: number = 20,
  ) {
    const now = new Date();
    const where: any = {
      participants: { user: { id: userId } },
    };

    if (type === 'upcoming') {
      where.endTime = { $gte: now };
    } else if (type === 'history') {
      where.endTime = { $lt: now };
    }

    const [schedules, total] = await this.em.findAndCount(Schedule, where, {
      populate: ['creator', 'participants.user', 'attachments'],
      orderBy: { startTime: 'DESC' },
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      items: schedules.map(s => this.toResponseDto(s)),
      total,
      page,
      pageSize
    };
  }

  /**
   * 更新日程
   */
  async updateSchedule(id: number, userId: number, dto: UpdateScheduleDto): Promise<ScheduleResponseDto> {
    const schedule = await this.em.findOne(Schedule, { id }, {
      populate: ['creator', 'participants.user', 'attachments'],
    });

    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }

    // 权限检查：只有创建者可以编辑
    if (schedule.creator.id !== userId) {
      throw new ForbiddenException('无权限修改此日程');
    }

    if (dto.title) schedule.title = dto.title;
    if (dto.description !== undefined) schedule.description = dto.description;
    if (dto.location !== undefined) schedule.location = dto.location;
    if (dto.startTime) schedule.startTime = new Date(dto.startTime);
    if (dto.endTime) schedule.endTime = new Date(dto.endTime);
    if (dto.maxParticipants !== undefined) schedule.maxParticipants = dto.maxParticipants;

    schedule.updatedAt = new Date();
    await this.em.flush();

    // 发送更新通知
    await this.notifyParticipants(schedule, NotificationType.UPDATE, '日程信息已更新');

    return this.toResponseDto(schedule);
  }

  /**
   * 取消日程
   */
  async cancelSchedule(id: number, userId: number): Promise<ScheduleResponseDto> {
    const schedule = await this.em.findOne(Schedule, { id }, {
      populate: ['creator', 'participants.user', 'attachments'],
    });

    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }

    // 权限检查
    if (schedule.creator.id !== userId) {
      throw new ForbiddenException('无权限取消此日程');
    }

    schedule.status = ScheduleStatus.CANCELLED;
    schedule.updatedAt = new Date();
    await this.em.flush();

    // 发送取消通知
    await this.notifyParticipants(schedule, NotificationType.CANCELLATION, '日程已被取消');

    return this.toResponseDto(schedule);
  }

  /**
   * 邀请成员
   */
  async inviteMembers(id: number, userId: number, dto: InviteMembersDto): Promise<ScheduleResponseDto> {
    const schedule = await this.em.findOne(Schedule, { id }, {
      populate: ['creator', 'participants.user', 'attachments'],
    });

    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }

    // 权限检查：只有创建者可以邀请
    if (schedule.creator.id !== userId) {
      throw new ForbiddenException('无权限邀请成员');
    }

    let inviteeIds: number[] = [];

    if (dto.userIds && dto.userIds.length > 0) {
      inviteeIds = dto.userIds;
    } else if (dto.departments && dto.departments.length > 0) {
      // 按部门查找用户
      const users = await this.em.find(User, { department: { $in: dto.departments } });
      inviteeIds = users.map(u => u.id);
    } else if (dto.inviteAll) {
      // 邀请全体成员
      const users = await this.em.find(User, { isActive: true });
      inviteeIds = users.map(u => u.id);
    }

    if (inviteeIds.length > 0) {
      await this.inviteMembersInternal(schedule, inviteeIds);
    }

    // 重新加载
    await this.em.populate(schedule, ['participants.user']);
    return this.toResponseDto(schedule);
  }

  /**
   * 内部方法：执行邀请逻辑
   */
  private async inviteMembersInternal(schedule: Schedule, userIds: number[]) {
    for (const uid of userIds) {
      try {
        const existing = await this.em.findOne(ScheduleParticipant, {
          schedule: schedule.id,
          user: { id: uid },
        });
        
        if (!existing) {
          const user = await this.em.findOne(User, { id: uid });
          if (user) {
            const participant = new ScheduleParticipant();
            participant.schedule = schedule;
            participant.user = user;
            participant.status = ParticipantStatus.INVITED;
            await this.em.persistAndFlush(participant);

            // 发送邀请通知
            await this.createNotification(
              user,
              NotificationType.INVITATION,
              `新的活动邀请：${schedule.title}`,
              `你被邀请参加"${schedule.title}"活动`,
              schedule.id,
            );
          }
        }
      } catch (error) {
        // 跳过失败的用户，继续邀请其他人
      }
    }
  }

  /**
   * 提交请假
   */
  async submitLeave(id: number, userId: number, dto: SubmitLeaveDto) {
    const schedule = await this.em.findOne(Schedule, { id }, {
      populate: ['creator'],
    });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }

    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const participant = await this.em.findOne(ScheduleParticipant, {
      schedule: schedule.id,
      user: user.id,
    });

    if (!participant) {
      throw new NotFoundException('你不是该活动的参与者');
    }

    participant.status = ParticipantStatus.LEAVE;
    participant.leaveReason = dto.reason;
    participant.leaveTime = new Date();
    await this.em.flush();

    // 通知发起人
    await this.createNotification(
      schedule.creator,
      NotificationType.LEAVE,
      `${user.name || user.schoolId} 请假`,
      `${user.name || user.schoolId} 因"${dto.reason}"请假`,
      schedule.id,
    );

    return {
      id: participant.id,
      status: participant.status,
      leaveReason: participant.leaveReason,
      leaveTime: participant.leaveTime,
    };
  }

  /**
   * 获取请假列表（供发起人查看）
   */
  async getLeaveRequests(id: number, userId: number) {
    const schedule = await this.em.findOne(Schedule, { id }, {
      populate: ['creator'],
    });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }

    // 权限检查：只有创建者可以查看
    if (schedule.creator.id !== userId) {
      throw new ForbiddenException('无权限查看请假信息');
    }

    const leaves = await this.em.find(ScheduleParticipant, {
      schedule: schedule.id,
      status: ParticipantStatus.LEAVE,
    }, {
      populate: ['user'],
      orderBy: { leaveTime: 'DESC' },
    });

    return leaves.map(l => ({
      id: l.id,
      user: {
        id: l.user.id,
        schoolId: l.user.schoolId,
        name: l.user.name,
      },
      leaveReason: l.leaveReason,
      leaveTime: l.leaveTime,
    }));
  }

  /**
   * 确认参加活动
   */
  async confirmParticipation(id: number, userId: number) {
    const schedule = await this.em.findOne(Schedule, { id });
    if (!schedule) {
      throw new NotFoundException('日程不存在');
    }

    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const participant = await this.em.findOne(ScheduleParticipant, {
      schedule: schedule.id,
      user: user.id,
    });

    if (!participant) {
      throw new NotFoundException('你不是该活动的被邀请者');
    }

    participant.status = ParticipantStatus.CONFIRMED;
    await this.em.flush();

    return {
      id: participant.id,
      status: participant.status,
    };
  }

  /**
   * 导出 CSV 数据
   */
  async exportToCsv(userId: number, type: 'upcoming' | 'history') {
    const schedules = await this.em.find(Schedule, {
      participants: { user: { id: userId } },
      ...(type === 'upcoming' ? { endTime: { $gte: new Date() } } : { endTime: { $lt: new Date() } }),
    }, {
      populate: ['creator', 'participants.user'],
      orderBy: { startTime: 'ASC' },
    });

    return schedules.map(s => ({
      id: s.id,
      title: s.title,
      location: s.location || '',
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      creator: s.creator.name || s.creator.schoolId,
      participants: s.participants.getItems().map(p => p.user.name || p.user.schoolId).join(', '),
      status: s.status,
    }));
  }

  /**
   * 获取用户的通知列表
   */
  async getUserNotifications(userId: number, unreadOnly: boolean = false) {
    const where: any = { recipient: { id: userId } };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await this.em.find(ScheduleNotification, where, {
      orderBy: { createdAt: 'DESC' },
      limit: 50,
    });

    const unreadCount = await this.em.count(ScheduleNotification, {
      recipient: { id: userId },
      isRead: false,
    });

    return { notifications, unreadCount };
  }

  /**
   * 标记通知为已读
   */
  async markNotificationAsRead(notificationId: number, userId: number) {
    const notification = await this.em.findOne(ScheduleNotification, {
      id: notificationId,
      recipient: { id: userId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    notification.isRead = true;
    await this.em.flush();

    return notification;
  }

  /**
   * 内部方法：创建通知
   */
  private async createNotification(
    recipient: User,
    type: NotificationType,
    title: string,
    content: string,
    relatedScheduleId?: number,
  ) {
    const notification = new ScheduleNotification();
    notification.recipient = recipient;
    notification.type = type;
    notification.title = title;
    notification.content = content;
    notification.relatedScheduleId = relatedScheduleId;
    await this.em.persistAndFlush(notification);
    return notification;
  }

  /**
   * 内部方法：通知所有参与者
   */
  private async notifyParticipants(
    schedule: Schedule,
    type: NotificationType,
    message: string,
  ) {
    const participants = await this.em.find(ScheduleParticipant, {
      schedule: schedule.id,
    }, { populate: ['user'] });

    for (const p of participants) {
      await this.createNotification(
        p.user,
        type,
        `${schedule.title} - ${type === NotificationType.CANCELLATION ? '取消通知' : '更新通知'}`,
        message,
        schedule.id,
      );
    }
  }
}
