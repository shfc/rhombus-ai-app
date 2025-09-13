import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(),
});

// Mock Response constructor for Node.js environment
if (typeof Response === 'undefined') {
  global.Response = class Response {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: BodyInit | null;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.body = body || null;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = (init?.headers as Record<string, string>) || {};
    }

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }

    async text() {
      return String(this.body);
    }
  } as typeof Response;
}

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
