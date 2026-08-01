import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideIconify } from './provide-iconify';
import { ErrorHandler } from '@angular/core';

describe('provideIconify', () => {
  let mockErrorHandler: Partial<ErrorHandler>;

  beforeEach(() => {
    mockErrorHandler = {
      handleError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorHandler, useValue: mockErrorHandler },
      ],
    });
  });

  it('returns EnvironmentProviders with config token and initializer', () => {
    const providers = provideIconify({ offlineCollections: [] });

    expect(providers).toBeDefined();
    expect(typeof providers).toBe('object');
  });

  it('provides NGX_ICONIFY_CONFIG token with passed config', () => {
    const config = {
      offlineCollections: [{ prefix: 'mdi', icons: {} }],
      apiProvider: { name: 'custom', resource: '/api' },
    };
    const providers = provideIconify(config);

    expect(providers).toBeDefined();
  });

  it('does not attempt to load iconify-icon on server platform', async () => {
    const { PLATFORM_ID } = await import('@angular/core');

    TestBed.configureTestingModule({
      providers: [
        provideIconify({}),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: ErrorHandler, useValue: mockErrorHandler },
      ],
    });

    expect(mockErrorHandler.handleError).not.toHaveBeenCalled();
  });
});
