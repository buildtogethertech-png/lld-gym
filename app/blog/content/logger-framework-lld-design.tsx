export default function Content() {
  return (
    <>
      <p>
        Logger System Low Level Design is a pattern-rich problem that tests your understanding of the
        Chain of Responsibility, Singleton, and Observer patterns. It is asked at companies across all
        levels and serves as a reference design for the Java logging framework (java.util.logging, Log4j).
        This guide covers the complete Logger LLD with Java code, class diagram, and FAQ.
      </p>

      <h2>Why Interviewers Ask Logger System LLD</h2>
      <p>
        The logger problem is a pattern showcase in disguise. Interviewers want to see:
      </p>
      <ul>
        <li>Do you use Chain of Responsibility for log level filtering — only log above threshold?</li>
        <li>Can you design pluggable handlers (Console, File, Remote) without changing Logger?</li>
        <li>Do you use Singleton for the Logger so all classes share one instance?</li>
        <li>Can you design pluggable formatters (text, JSON, structured) as Strategy?</li>
        <li>Do you think about async logging for performance — non-blocking writes?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Support log levels: TRACE, DEBUG, INFO, WARN, ERROR — only log at or above configured level</li>
        <li>Multiple handlers: ConsoleHandler (stdout), FileHandler (rolling files), RemoteHandler (HTTP)</li>
        <li>Multiple formatters: PlainText, JSON, Structured (key=value)</li>
        <li>Logger is a Singleton — application-wide single instance</li>
        <li>Handlers can be added or removed at runtime</li>
        <li>Async logging: writes should not block the calling thread</li>
        <li>Log record includes: level, timestamp, thread name, class name, message, exception</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Log writes should add less than 1ms latency to the calling thread</li>
        <li>Adding a new handler (e.g., Slack alert) must not change Logger or existing handlers</li>
        <li>Level filtering must happen before any serialization (cheap early exit)</li>
        <li>Thread-safe: multiple threads logging simultaneously must not corrupt log output</li>
      </ul>

      <h2>Core Entities — Logger System LLD Class Design</h2>
      <ul>
        <li><strong>Logger</strong> — Singleton; root log level, list of handlers</li>
        <li><strong>LogRecord</strong> — level, timestamp, threadName, className, message, throwable</li>
        <li><strong>LogLevel</strong> — TRACE(0), DEBUG(1), INFO(2), WARN(3), ERROR(4)</li>
        <li><strong>LogHandler</strong> — abstract; Chain of Responsibility; contains LogFormatter</li>
        <li><strong>ConsoleHandler / FileHandler / RemoteHandler</strong> extend LogHandler</li>
        <li><strong>LogFormatter</strong> — interface; PlainTextFormatter, JsonFormatter implement it</li>
        <li><strong>AsyncLogger</strong> — wraps Logger, uses BlockingQueue + background thread</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`LogLevel (enum)
+-- TRACE(0), DEBUG(1), INFO(2), WARN(3), ERROR(4)
+-- isAtLeastAs(other): boolean

LogRecord
+-- level: LogLevel
+-- timestamp: LocalDateTime
+-- threadName, className, message: String
+-- throwable: Throwable (nullable)

LogFormatter (interface)
+-- format(record): String

PlainTextFormatter implements LogFormatter
JsonFormatter       implements LogFormatter

LogHandler (abstract — Chain of Responsibility)
+-- level: LogLevel  (handler-level threshold)
+-- next: LogHandler
+-- formatter: LogFormatter
+-- handle(record): void   // check level, format, write, pass to next
+-- write(formatted): void // abstract — overridden per handler

ConsoleHandler extends LogHandler
FileHandler    extends LogHandler
RemoteHandler  extends LogHandler

Logger (Singleton)
+-- level: LogLevel  (root threshold)
+-- handlers: List<LogHandler>
+-- log(level, message, throwable): void
+-- addHandler(handler), removeHandler(handler): void`}</pre>

      <h2>Chain of Responsibility — Log Handlers</h2>
      <pre>{`public abstract class LogHandler {
    protected LogLevel level;
    protected LogHandler next;
    protected LogFormatter formatter;

    public LogHandler setNext(LogHandler next) {
        this.next = next;
        return next;
    }

    public void handle(LogRecord record) {
        if (record.getLevel().ordinal() >= this.level.ordinal()) {
            String formatted = formatter.format(record);
            write(formatted);
        }
        if (next != null) next.handle(record); // always pass down the chain
    }

    protected abstract void write(String formattedMessage);
}

public class ConsoleHandler extends LogHandler {
    public ConsoleHandler(LogLevel level, LogFormatter formatter) {
        this.level = level;
        this.formatter = formatter;
    }

    @Override
    protected void write(String formattedMessage) {
        System.out.println(formattedMessage);
    }
}

public class FileHandler extends LogHandler {
    private final String filePath;
    private final long maxFileSizeBytes;
    private final int maxBackupFiles;
    private PrintWriter writer;
    private long currentFileSize = 0;

    public FileHandler(LogLevel level, LogFormatter formatter, String filePath,
                       long maxFileSizeBytes, int maxBackupFiles) throws IOException {
        this.level = level;
        this.formatter = formatter;
        this.filePath = filePath;
        this.maxFileSizeBytes = maxFileSizeBytes;
        this.maxBackupFiles = maxBackupFiles;
        this.writer = new PrintWriter(new FileWriter(filePath, true));
    }

    @Override
    protected synchronized void write(String formattedMessage) {
        writer.println(formattedMessage);
        writer.flush();
        currentFileSize += formattedMessage.length();
        if (currentFileSize > maxFileSizeBytes) rotate();
    }

    private void rotate() {
        writer.close();
        // Rename current file to .1, shift older files, open fresh file
        for (int i = maxBackupFiles - 1; i >= 1; i--) {
            new File(filePath + "." + i).renameTo(new File(filePath + "." + (i + 1)));
        }
        new File(filePath).renameTo(new File(filePath + ".1"));
        try { writer = new PrintWriter(new FileWriter(filePath)); } catch (IOException ignored) {}
        currentFileSize = 0;
    }
}`}</pre>

      <h2>Logger Singleton and Formatters</h2>
      <pre>{`public class Logger {
    private static volatile Logger instance;
    private LogLevel level;
    private final List<LogHandler> handlers = new CopyOnWriteArrayList<>();

    private Logger(LogLevel level) { this.level = level; }

    public static Logger getInstance(LogLevel level) {
        if (instance == null) {
            synchronized (Logger.class) {
                if (instance == null) instance = new Logger(level);
            }
        }
        return instance;
    }

    public void addHandler(LogHandler handler) { handlers.add(handler); }
    public void removeHandler(LogHandler handler) { handlers.remove(handler); }

    public void log(LogLevel level, String message, Throwable t) {
        if (level.ordinal() < this.level.ordinal()) return; // early exit

        LogRecord record = new LogRecord(level, LocalDateTime.now(),
            Thread.currentThread().getName(), getCallerClass(), message, t);

        for (LogHandler handler : handlers) {
            handler.handle(record); // each handler is the head of its chain
        }
    }

    public void info(String msg)  { log(LogLevel.INFO,  msg, null); }
    public void warn(String msg)  { log(LogLevel.WARN,  msg, null); }
    public void error(String msg, Throwable t) { log(LogLevel.ERROR, msg, t); }

    private String getCallerClass() {
        return StackWalker.getInstance().walk(frames ->
            frames.skip(3).findFirst().map(f -> f.getClassName()).orElse("Unknown"));
    }
}

// JSON formatter
public class JsonFormatter implements LogFormatter {
    @Override
    public String format(LogRecord record) {
        return String.format(
            "{\"level\":\"%s\",\"time\":\"%s\",\"thread\":\"%s\",\"class\":\"%s\",\"message\":\"%s\"}",
            record.getLevel(), record.getTimestamp(), record.getThreadName(),
            record.getClassName(), escapeJson(record.getMessage())
        );
    }

    private String escapeJson(String s) {
        return s.replace("\"", "\\\"").replace("\n", "\\n");
    }
}`}</pre>

      <h2>Async Logger — Non-Blocking Writes</h2>
      <pre>{`public class AsyncLogger {
    private final Logger syncLogger;
    private final BlockingQueue<LogRecord> queue = new LinkedBlockingQueue<>(10_000);
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    public AsyncLogger(Logger syncLogger) {
        this.syncLogger = syncLogger;
        worker.submit(this::processQueue);
    }

    public void log(LogLevel level, String message, Throwable t) {
        LogRecord record = new LogRecord(level, LocalDateTime.now(),
            Thread.currentThread().getName(), "AsyncLogger", message, t);
        if (!queue.offer(record)) {
            // Queue full — drop or use overflow strategy
            System.err.println("Log queue full — record dropped: " + message);
        }
    }

    private void processQueue() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                LogRecord record = queue.take(); // blocks until record available
                syncLogger.log(record.getLevel(), record.getMessage(), record.getThrowable());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Chain of Responsibility for handlers:</strong> Each handler decides independently whether
          to process a record based on its own level threshold. A WARN-level FileHandler writes only WARN
          and ERROR, while an INFO-level ConsoleHandler writes INFO, WARN, and ERROR. Records always
          pass down the full chain — each handler decides independently.
        </li>
        <li>
          <strong>Double-checked locking for Singleton:</strong> volatile on the instance field prevents
          the JVM from returning a partially constructed Logger (JIT reordering). The outer null check
          avoids synchronization on every call after initialization.
        </li>
        <li>
          <strong>CopyOnWriteArrayList for handlers:</strong> Handlers are rarely added or removed but
          frequently iterated. CopyOnWriteArrayList is thread-safe for concurrent reads with no locking.
          Handler add/remove is O(n) — acceptable for the expected handler count (2-5).
        </li>
        <li>
          <strong>BlockingQueue for async:</strong> The calling thread puts a record into the queue (O(1),
          sub-microsecond). A single background thread drains the queue and calls the synchronous handlers.
          This decouples logging latency from I/O latency completely.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you implement log file rotation?"</strong> — FileHandler tracks current file size.
          On each write, if size exceeds maxFileSizeBytes, rename app.log to app.log.1, shift older files,
          and open a fresh app.log. Limit maxBackupFiles to avoid unbounded disk usage.
        </li>
        <li>
          <strong>"How do you add a Slack alert for ERROR logs?"</strong> — Create a SlackHandler that
          extends LogHandler with level=ERROR. Its write() method calls the Slack webhook API. Add it to
          the Logger's handler list. Zero changes to any existing code.
        </li>
        <li>
          <strong>"How do you prevent sensitive data from appearing in logs?"</strong> — Add a
          SanitizingFormatter that wraps any other LogFormatter. It applies regex patterns to mask credit
          card numbers, passwords, and PAN numbers before passing to the underlying formatter.
        </li>
      </ul>

      <h2>FAQ — Logger System Low Level Design</h2>

      <h3>What design patterns are used in Logger Framework LLD?</h3>
      <p>
        The primary patterns are <strong>Chain of Responsibility</strong> (log handlers filter and pass
        records), <strong>Singleton</strong> (one Logger instance per application), and
        <strong>Strategy</strong> (LogFormatter — PlainText, JSON). The <strong>Observer</strong> pattern
        is optionally used when handlers subscribe to level-specific event streams.
      </p>

      <h3>Why is the Chain of Responsibility pattern used in logging?</h3>
      <p>
        Multiple handlers need to process the same log record independently. Each handler has its own
        level threshold and formatter. The chain ensures all handlers get a chance to process the record
        without the Logger needing to know which handlers will act on it. Adding a handler is an append
        to the chain — no Logger code changes.
      </p>

      <h3>How do you make a logger thread-safe?</h3>
      <p>
        Use CopyOnWriteArrayList for the handler list (safe concurrent reads). Use double-checked locking
        with volatile for the Singleton. In FileHandler, synchronize the write() method so concurrent
        threads do not interleave their log lines. Async logger adds another layer: the calling thread
        only touches the BlockingQueue, which is inherently thread-safe.
      </p>

      <h3>How does async logging improve performance?</h3>
      <p>
        Synchronous logging forces the calling thread to wait for disk I/O. A disk write can take 1-10ms
        — at 1000 log calls/second, this adds 1-10 seconds of blocking time. Async logging offloads disk
        I/O to a background thread. The calling thread only adds to an in-memory queue (nanoseconds).
        The tradeoff: on crash, the last N records in the queue may be lost.
      </p>
    </>
  );
}
