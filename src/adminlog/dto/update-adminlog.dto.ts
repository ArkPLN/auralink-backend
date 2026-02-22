import { PartialType } from '@nestjs/swagger';
import { CreateAdminlogDto } from './create-adminlog.dto';

export class UpdateAdminlogDto extends PartialType(CreateAdminlogDto) {}
