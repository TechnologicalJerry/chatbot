import { Injectable, Logger } from '@nestjs/common';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);

  getToolDefinitions(): ToolDefinition[] {
    return [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get the current weather forecast for a given location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' },
              unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
            },
            required: ['location'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'calculator',
          description: 'Perform a mathematical calculation',
          parameters: {
            type: 'object',
            properties: {
              expression: { type: 'string', description: 'Mathematical expression to evaluate e.g. 2 + 2 * 4' },
            },
            required: ['expression'],
          },
        },
      },
    ];
  }

  async executeTool(name: string, args: Record<string, any>): Promise<any> {
    this.logger.log(`Executing tool: ${name} with args: ${JSON.stringify(args)}`);

    switch (name) {
      case 'get_weather':
        const location = args.location || 'Unknown';
        const unit = args.unit || 'celsius';
        return {
          location,
          temperature: unit === 'fahrenheit' ? 72 : 22,
          unit,
          condition: 'Sunny with mild breeze',
          humidity: '45%',
        };

      case 'calculator':
        try {
          // Simple safe evaluation for demo math expressions
          const expr = String(args.expression).replace(/[^0-9+\-*/().]/g, '');
          const result = Function(`"use strict"; return (${expr})`)();
          return { expression: args.expression, result };
        } catch {
          return { error: 'Invalid mathematical expression' };
        }

      default:
        return { error: `Tool ${name} not found` };
    }
  }
}
