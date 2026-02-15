import { Test, TestingModule } from '@nestjs/testing';
import { AdminlogService } from './adminlog.service';

describe('AdminlogService', () => {
  let service: AdminlogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminlogService],
    }).compile();

    service = module.get<AdminlogService>(AdminlogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
