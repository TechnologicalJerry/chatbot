import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistryService } from './tool-registry.service';

describe('ToolRegistryService', () => {
  let service: ToolRegistryService;

  beforeEach(() => {
    service = new ToolRegistryService();
  });

  it('should return tool definitions', () => {
    const definitions = service.getToolDefinitions();
    expect(definitions.length).toBeGreaterThan(0);
    expect(definitions.some((t) => t.function.name === 'get_weather')).toBe(true);
  });

  it('should execute get_weather tool', async () => {
    const res = await service.executeTool('get_weather', { location: 'Tokyo' });
    expect(res.location).toBe('Tokyo');
    expect(res.condition).toBeDefined();
  });

  it('should execute calculator tool', async () => {
    const res = await service.executeTool('calculator', { expression: '10 + 5 * 2' });
    expect(res.result).toBe(20);
  });
});
