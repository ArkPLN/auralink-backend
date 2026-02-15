import { Test, TestingModule } from '@nestjs/testing';
import { AdminlogController } from './adminlog.controller';
import { AdminlogService } from './adminlog.service';

describe('AdminlogController', () => {
  let controller: AdminlogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminlogController],
      providers: [AdminlogService],
    }).compile();

    controller = module.get<AdminlogController>(AdminlogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
