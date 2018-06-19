const hiddenLogFn = () => void 0;

export type LogggerFunction = (...messages: any[]) => void;

class Logger {
  constructor(public showLogs: boolean = false) {}

  setLogging(logging: boolean): void {
    this.showLogs = logging;
  }

  isLogging(): boolean {
    return this.showLogs;
  }

  get log(): LogggerFunction {
    return this.showLogs ? console.log : hiddenLogFn;
  }

  get warning(): LogggerFunction {
    return this.showLogs ? console.warn : hiddenLogFn;
  }

  get error(): LogggerFunction {
    return this.showLogs ? console.error : hiddenLogFn;
  }
}

export const logger = new Logger();
