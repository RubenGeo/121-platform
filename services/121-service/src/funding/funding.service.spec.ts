import { DisberseApiService } from './disberse-api.service';
import { Test, TestingModule } from '@nestjs/testing';
import { FundingService } from './funding.service';
import { HttpModule } from '@nestjs/common';

describe('FundingService', () => {
  let service: FundingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [FundingService, DisberseApiService],
    }).compile();

    service = module.get<FundingService>(FundingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
