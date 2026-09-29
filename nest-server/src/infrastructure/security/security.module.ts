import { Module, Global } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';
import { QuotaService } from './quota.service';
import { AbuseDetectorService } from './abuse-detector.service';

@Global()
@Module({
  providers: [RateLimiterService, QuotaService, AbuseDetectorService],
  exports: [RateLimiterService, QuotaService, AbuseDetectorService],
})
export class SecurityModule {}
