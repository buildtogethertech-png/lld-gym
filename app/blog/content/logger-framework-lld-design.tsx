export default function Content() {
  return (
    <>
      <p>Designing a Logging Framework tests your knowledge of Chain of Responsibility, Singleton, and the Template Method pattern. It's a solid beginner-to-intermediate LLD problem that appears in SDE-1 interviews and as a warm-up in senior interviews.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>Logger</strong> — named logger, has a minimum log level and list of handlers</li>
        <li><strong>LogRecord</strong> — level, message, timestamp, logger name, context</li>
        <li><strong>Handler</strong> — processes a LogRecord (Console, File, Database, Remote)</li>
        <li><strong>Formatter</strong> — formats a LogRecord into a string</li>
        <li><strong>LogLevel</strong> — DEBUG(10), INFO(20), WARNING(30), ERROR(40), CRITICAL(50)</li>
      </ul>
      <h2>Chain of Responsibility for Handlers</h2>
      <pre>{`abstract class LogHandler {
  protected next: LogHandler | null = null;
  protected level: LogLevel;

  setNext(handler: LogHandler): LogHandler { this.next = handler; return handler; }

  handle(record: LogRecord): void {
    if (record.level >= this.level) this.emit(record); // This handler processes it
    this.next?.handle(record);                          // Pass to next handler too
  }

  abstract emit(record: LogRecord): void;
}

class ConsoleHandler extends LogHandler {
  emit(record: LogRecord) {
    console.log(this.formatter.format(record));
  }
}

class FileHandler extends LogHandler {
  emit(record: LogRecord) {
    this.fileWriter.append(this.logFile, this.formatter.format(record));
  }
}`}</pre>
      <h2>Logger — Singleton per Name</h2>
      <pre>{`class LoggerRegistry {
  private static loggers = new Map<string, Logger>();

  static getLogger(name: string): Logger {
    if (!this.loggers.has(name)) {
      const logger = new Logger(name);
      // Attach default handlers from root config
      logger.addHandler(new ConsoleHandler(LogLevel.DEBUG));
      this.loggers.set(name, logger);
    }
    return this.loggers.get(name)!;
  }
}

class Logger {
  private handlers: LogHandler[] = [];
  private level: LogLevel = LogLevel.DEBUG;

  log(level: LogLevel, message: string, context?: object) {
    if (level < this.level) return; // Filter below configured level
    const record = new LogRecord(level, message, this.name, context);
    this.handlers.forEach(h => h.handle(record));
  }
  debug(msg: string)    { this.log(LogLevel.DEBUG, msg); }
  info(msg: string)     { this.log(LogLevel.INFO, msg); }
  error(msg: string)    { this.log(LogLevel.ERROR, msg); }
}`}</pre>
      <h2>Formatter — Template Method</h2>
      <pre>{`abstract class LogFormatter {
  format(record: LogRecord): string {
    return \`[\${this.formatTimestamp(record.timestamp)}] \${this.formatLevel(record.level)} \${this.formatMessage(record)}\`;
  }
  abstract formatTimestamp(ts: Date): string;
  abstract formatLevel(level: LogLevel): string;
  abstract formatMessage(record: LogRecord): string;
}
class JSONFormatter extends LogFormatter {
  formatTimestamp(ts: Date) { return ts.toISOString(); }
  formatLevel(level: LogLevel) { return LogLevel[level]; }
  formatMessage(record: LogRecord) { return JSON.stringify({ msg: record.message, ctx: record.context }); }
}`}</pre>
    </>
  );
}
