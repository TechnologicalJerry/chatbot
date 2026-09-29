import { Injectable, Logger } from '@nestjs/common';

const SUSPICIOUS_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all prior prompts/i,
  /system prompt override/i,
  /you are now Dan/i,
  /developer mode enabled/i,
  /jailbreak/i,
  /reveal system message/i,
  /print system instructions/i,
];

@Injectable()
export class AbuseDetectorService {
  private readonly logger = new Logger(AbuseDetectorService.name);

  detectPromptInjection(text: string): { isSuspicious: boolean; matches: string[] } {
    const matches: string[] = [];
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        matches.push(pattern.source);
      }
    }

    if (matches.length > 0) {
      this.logger.warn(`Prompt injection pattern detected: ${matches.join(', ')}`);
    }

    return {
      isSuspicious: matches.length > 0,
      matches,
    };
  }

  sanitizeInput(userContent: string): string {
    const sanitized = userContent
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<user_input>${sanitized}</user_input>`;
  }
}
