import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitService {
  private readonly maxPerMinute: number;
  private readonly window = 60 * 1000;
  private readonly counts = new Map<string, { count: number; resetAt: number }>();

  constructor(private config: ConfigService) {
    this.maxPerMinute = this.config.get<number>('rateLimit.maxPerMinute') ?? 10;
  }

  check(waUserId: string): boolean {
    const now = Date.now();
    let entry = this.counts.get(waUserId);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.window };
      this.counts.set(waUserId, entry);
    }

    entry.count++;
    return entry.count <= this.maxPerMinute;
  }

  getRemaining(waUserId: string): number {
    const entry = this.counts.get(waUserId);
    if (!entry) return this.maxPerMinute;
    return Math.max(0, this.maxPerMinute - entry.count);
  }
}
