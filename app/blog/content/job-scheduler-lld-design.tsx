export default function Content() {
  return (
    <>
      <p>
        Job Scheduler (Distributed Cron) is a senior-level Low Level Design problem asked at Amazon,
        Flipkart, and Uber. It requires priority queue scheduling, cron expression parsing, retry with
        exponential backoff, and distributed worker coordination. This guide covers the complete Job
        Scheduler LLD with Java code, class diagram, and interview FAQ.
      </p>

      <h2>Why Interviewers Ask Job Scheduler LLD</h2>
      <p>
        Job scheduling combines data structures, concurrency, and distributed systems thinking. Interviewers
        want to see:
      </p>
      <ul>
        <li>Do you use PriorityQueue to efficiently find the next job to run?</li>
        <li>Can you design a Job with cron expression, retry config, and execution history?</li>
        <li>Do you use Command pattern to decouple job definition from execution?</li>
        <li>Can you prevent duplicate execution when multiple workers compete for the same job?</li>
        <li>Do you implement exponential backoff for failed jobs without blocking other jobs?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Schedule a one-time job to run at a specific time</li>
        <li>Schedule a recurring job using a cron expression (e.g., every 5 minutes)</li>
        <li>Jobs have a priority — higher priority jobs run first when multiple are due simultaneously</li>
        <li>Failed jobs retry with exponential backoff (max 3 attempts)</li>
        <li>Cancel a scheduled job</li>
        <li>View job status: PENDING, RUNNING, SUCCESS, FAILED, CANCELLED</li>
        <li>Workers are distributed — multiple machines can pick up jobs</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>No two workers must execute the same job instance simultaneously</li>
        <li>Missed jobs (scheduler was down) must be caught up or skipped based on policy</li>
        <li>Adding a new job type must not change the scheduler core (OCP)</li>
        <li>Scheduler must handle 10,000 jobs per minute</li>
      </ul>

      <h2>Core Entities — Job Scheduler LLD Class Design</h2>
      <ul>
        <li><strong>Job</strong> — id, name, type, priority, schedule (cron or one-time), retryConfig, status</li>
        <li><strong>JobInstance</strong> — id, jobId, scheduledAt, startedAt, completedAt, attempt, status</li>
        <li><strong>JobCommand</strong> — interface; execute() — Command pattern for job logic</li>
        <li><strong>JobScheduler</strong> — main loop; picks next due job from priority queue</li>
        <li><strong>WorkerPool</strong> — thread pool that executes job commands</li>
        <li><strong>DistributedLock</strong> — ensures one worker per job instance (Redis SETNX)</li>
        <li><strong>RetryPolicy</strong> — maxAttempts, backoffMultiplier</li>
        <li><strong>CronExpression</strong> — parses cron string, computes next run time</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Job
+-- id, name: String
+-- cronExpression: String  (null for one-time)
+-- nextRunTime: LocalDateTime
+-- priority: int (higher = more urgent)
+-- retryPolicy: RetryPolicy
+-- status: JobStatus (ACTIVE/PAUSED/CANCELLED)
+-- commandClass: String  (class name to instantiate)

JobInstance
+-- id, jobId: String
+-- scheduledAt, startedAt, completedAt: LocalDateTime
+-- attempt: int
+-- status: InstanceStatus (PENDING/RUNNING/SUCCESS/FAILED)
+-- errorMessage: String

JobCommand (interface)
+-- execute(JobContext): void

RetryPolicy
+-- maxAttempts: int
+-- initialDelaySeconds: long
+-- backoffMultiplier: double

CronExpression
+-- expression: String
+-- getNextFireTime(from: LocalDateTime): LocalDateTime

JobScheduler
+-- queue: PriorityQueue<Job>  (ordered by nextRunTime, then priority)
+-- start(): void  (main loop)
+-- schedule(job): void
+-- cancel(jobId): void`}</pre>

      <h2>Command Pattern — Job Execution</h2>
      <pre>{`public interface JobCommand {
    void execute(JobContext context) throws Exception;
}

// Example: email report job
public class SendDailyReportCommand implements JobCommand {
    @Override
    public void execute(JobContext context) throws Exception {
        String reportDate = context.getParam("reportDate");
        Report report = reportService.generateDailyReport(reportDate);
        emailService.send(report);
    }
}

// Command factory resolves class name to instance
public class JobCommandFactory {
    public JobCommand create(String commandClass) {
        try {
            Class<?> clazz = Class.forName(commandClass);
            return (JobCommand) applicationContext.getBean(clazz);
        } catch (ClassNotFoundException e) {
            throw new UnknownJobTypeException(commandClass);
        }
    }
}`}</pre>

      <h2>JobScheduler — Priority Queue Main Loop</h2>
      <pre>{`public class JobScheduler {
    // Min-heap by nextRunTime, then by priority (higher priority = lower queue value)
    private final PriorityQueue<Job> queue = new PriorityQueue<>(
        Comparator.comparing(Job::getNextRunTime)
                  .thenComparingInt(j -> -j.getPriority())
    );
    private final WorkerPool workerPool;
    private final DistributedLock distributedLock;
    private final JobRepository jobRepo;
    private volatile boolean running = true;

    public void start() {
        // Load all active jobs from DB into queue
        jobRepo.findByStatus(JobStatus.ACTIVE).forEach(queue::add);

        while (running) {
            Job job = queue.peek();
            if (job == null || job.getNextRunTime().isAfter(LocalDateTime.now())) {
                Thread.sleep(1000); // check every second
                continue;
            }

            queue.poll();
            String lockKey = "job-lock:" + job.getId();

            // Distributed lock: only one worker executes this instance
            if (!distributedLock.tryAcquire(lockKey, 30, TimeUnit.SECONDS)) {
                continue; // another worker got it
            }

            workerPool.submit(() -> executeJob(job, lockKey));

            // Re-schedule if recurring
            if (job.getCronExpression() != null) {
                LocalDateTime next = CronExpression.parse(job.getCronExpression())
                    .getNextFireTime(LocalDateTime.now());
                job.setNextRunTime(next);
                queue.add(job);
            }
        }
    }

    private void executeJob(Job job, String lockKey) {
        JobInstance instance = new JobInstance(UUID.randomUUID().toString(), job.getId(),
            LocalDateTime.now(), null, null, 1, InstanceStatus.RUNNING);
        instanceRepo.save(instance);

        try {
            JobCommand command = commandFactory.create(job.getCommandClass());
            command.execute(new JobContext(job.getParams()));
            instance.setStatus(InstanceStatus.SUCCESS);
        } catch (Exception e) {
            instance.setStatus(InstanceStatus.FAILED);
            instance.setErrorMessage(e.getMessage());
            scheduleRetry(job, instance);
        } finally {
            instance.setCompletedAt(LocalDateTime.now());
            instanceRepo.save(instance);
            distributedLock.release(lockKey);
        }
    }

    private void scheduleRetry(Job job, JobInstance instance) {
        RetryPolicy policy = job.getRetryPolicy();
        if (instance.getAttempt() >= policy.getMaxAttempts()) return;

        long delaySeconds = (long) (policy.getInitialDelaySeconds()
            * Math.pow(policy.getBackoffMultiplier(), instance.getAttempt() - 1));

        Job retryJob = job.copy();
        retryJob.setNextRunTime(LocalDateTime.now().plusSeconds(delaySeconds));
        queue.add(retryJob);
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>PriorityQueue ordered by nextRunTime then priority:</strong> The scheduler only needs
          to check one element — the head of the queue — on each tick. If the head's nextRunTime is in the
          future, all others are too. O(log n) insertion and O(1) peek.
        </li>
        <li>
          <strong>Distributed lock prevents double execution:</strong> In a multi-worker environment,
          multiple schedulers may run simultaneously. A Redis SETNX lock with a TTL ensures only one
          worker executes a job instance. The lock expires automatically if the worker crashes mid-job.
        </li>
        <li>
          <strong>Command pattern for extensibility:</strong> The scheduler stores a class name (String)
          for each job, not a closure or lambda. New job types are added by implementing JobCommand —
          no changes to JobScheduler. The factory resolves the class at runtime.
        </li>
        <li>
          <strong>Retry as a new job instance:</strong> Failed jobs are re-added to the priority queue
          as a new entry with a delayed nextRunTime. This avoids blocking the queue while waiting for
          the retry delay and keeps retry state clean in JobInstance.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"What happens to jobs if the scheduler crashes?"</strong> — On restart, load all
          ACTIVE jobs from DB. Jobs with nextRunTime in the past are either immediately retried (catch-up
          mode) or skipped and rescheduled to the next future fire time (skip-missed mode) — configurable
          per job.
        </li>
        <li>
          <strong>"How do you implement cron expression parsing?"</strong> — Use a library like Quartz
          CronExpression for production. In an interview, describe the five cron fields (minute, hour,
          day, month, weekday) and show how to compute the next fire time by incrementing each field until
          the expression matches.
        </li>
        <li>
          <strong>"How do you scale the scheduler to handle 100,000 jobs?"</strong> — Partition jobs by
          a consistent hash of jobId across multiple scheduler nodes. Each node owns a subset of jobs.
          Coordinator election (ZooKeeper or etcd) handles node failures and rebalancing.
        </li>
      </ul>

      <h2>FAQ — Job Scheduler Low Level Design</h2>

      <h3>What data structure should you use for a job scheduler?</h3>
      <p>
        A min-heap (Java PriorityQueue) ordered by nextRunTime. Peek returns the job due soonest in O(1).
        Insertion and removal are O(log n). For a distributed scheduler, a database table with an index on
        nextRunTime and a row-level lock serves as a persistent priority queue.
      </p>

      <h3>How do you prevent duplicate job execution in a distributed scheduler?</h3>
      <p>
        Use a distributed lock (Redis SETNX with TTL, or a database SELECT FOR UPDATE) keyed on the job
        instance ID. The first worker to acquire the lock executes the job. Others see the lock is taken
        and skip. The TTL prevents deadlock if the worker crashes.
      </p>

      <h3>What is exponential backoff in job retry?</h3>
      <p>
        After each failure, wait longer before retrying: delay = initialDelay * backoffMultiplier^attempt.
        Example: 30s, 60s, 120s for backoffMultiplier=2. This prevents retry storms when a downstream
        service is degraded — spreading retries over time gives the service time to recover.
      </p>

      <h3>What design patterns are used in Job Scheduler LLD?</h3>
      <p>
        The primary patterns are <strong>Command</strong> (JobCommand encapsulates job logic),
        <strong>Strategy</strong> (retry policy), and <strong>Observer</strong> (notify callers of job
        completion). The priority queue is a standard data structure, not a design pattern, but central
        to the scheduler's correctness.
      </p>
    </>
  );
}
