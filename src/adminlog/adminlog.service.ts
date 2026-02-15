import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { AdminLog, AdminActionType } from './entities/adminlog.entity';
import { User } from '../user/entities/user.entity';
import {
  CreateAdminLogDto,
  QueryAdminLogDto,
  AdminLogResponseDto,
  AdminLogListResponseDto,
} from './dto/adminlog.dto';

@Injectable()
export class AdminlogService {
  constructor(private readonly em: EntityManager) {}

  async createLog(dto: CreateAdminLogDto): Promise<AdminLog> {
    const log = new AdminLog();
    const operator = await this.em.findOne(User, { id: dto.operatorId });
    if (!operator) {
      throw new Error('操作人不存在');
    }
    log.operator = operator;
    log.actionType = dto.actionType;
    log.ipAddress = dto.ipAddress;

    if (dto.targetId) {
      const target = await this.em.findOne(User, { id: dto.targetId });
      if (target) {
        log.target = target;
      }
    }

    if (dto.fieldName) log.fieldName = dto.fieldName;
    if (dto.oldValue !== undefined) log.oldValue = dto.oldValue;
    if (dto.newValue !== undefined) log.newValue = dto.newValue;
    if (dto.details) log.details = dto.details;

    await this.em.persist(log).flush();
    return log;
  }

  async findAll(query: QueryAdminLogDto): Promise<AdminLogListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const qb = this.em.createQueryBuilder(AdminLog, 'log');

    qb.leftJoinAndSelect('log.operator', 'operator');
    qb.leftJoinAndSelect('log.target', 'target');

    if (query.actionType) {
      qb.andWhere({ actionType: query.actionType });
    }

    if (query.operatorId) {
      qb.andWhere({ operator: query.operatorId });
    }

    if (query.targetId) {
      qb.andWhere({ target: query.targetId });
    }

    if (query.startTime) {
      qb.andWhere({ createdAt: { $gte: new Date(query.startTime) } });
    }

    if (query.endTime) {
      qb.andWhere({ createdAt: { $lte: new Date(query.endTime) } });
    }

    const [logs, total] = await qb.getResultAndCount();

    const logResponses: AdminLogResponseDto[] = logs.map((log) => ({
      id: log.id,
      operatorId: log.operator.id,
      operatorSchoolId: log.operator.schoolId,
      operatorName: log.operator.name ?? '',
      targetId: log.target?.id,
      targetSchoolId: log.target?.schoolId,
      targetName: log.target?.name ?? undefined,
      actionType: log.actionType,
      fieldName: log.fieldName,
      oldValue: log.oldValue,
      newValue: log.newValue,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));

    return {
      logs: logResponses,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<AdminLogResponseDto | null> {
    const log = await this.em.findOne(
      AdminLog,
      { id },
      { populate: ['operator', 'target'] },
    );

    if (!log) {
      return null;
    }

    return {
      id: log.id,
      operatorId: log.operator.id,
      operatorSchoolId: log.operator.schoolId,
      operatorName: log.operator.name ?? '',
      targetId: log.target?.id,
      targetSchoolId: log.target?.schoolId,
      targetName: log.target?.name ?? undefined,
      actionType: log.actionType,
      fieldName: log.fieldName,
      oldValue: log.oldValue,
      newValue: log.newValue,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    };
  }
}
