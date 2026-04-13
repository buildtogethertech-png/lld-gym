export default function Content() {
  return (
    <>
      <p>A Distributed Job Scheduler is an advanced LLD problem that tests your understanding of priority queues, retry policies, distributed coordination, and the Command pattern. It's asked at Amazon, Flipkart, and companies with complex background processing needs.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>Job</strong> — the unit of work; has type, payload, priority, schedule</li>
        <li><strong>JobDefinition</strong> — template for a job type (max retries, timeout)</li>
        <li><strong>Worker</strong> — picks up jobs and executes them</li>
        <li><strong>Queue</strong> — priority queue of pending jobs</li>
        <li><strong>Scheduler</strong> — triggers recurring/cron jobs</li>
        <li><strong>WorkerRegistry</strong> — tracks live workers via heartbeat</li>
      </ul>
      <h2>Command Pattern for Jobs</h2>
      <pre>{`interface JobCommand { execute(payload: any): Promise<JobResult>; }

class SendEmailJob implements JobCommand {
  async execute(payload: { to: string; subject: string; body: string }) {
    await this.emailService.send(payload.to, payload.subject, payload.body);
    return JobResult.success();
  }
}

class GenerateReportJob implements JobCommand {
  async execute(payload: { reportType: string; userId: string }) {
    const report = await this.reportService.generate(payload.reportType, payload.userId);
    await this.storageService.upload(report);
    return JobResult.success();
  }
}`}</pre>
      <h2>Priority Queue</h2>
      <pre>{`enum JobPriority { HIGH = 1, MEDIUM = 2, LOW = 3 }

class JobQueue {
  private queue: Job[] = [];

  enqueue(job: Job) {
    this.queue.push(job);
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.scheduledAt.getTime() - b.scheduledAt.getTime(); // FIFO within priority
    });
  }

  dequeue(): Job | null { return this.queue.shift() ?? null; }
}`}</pre>
      <h2>Retry with Exponential Backoff</h2>
      <pre>{`class Worker {
  async execute(job: Job) {
    try {
      const command = this.commandRegistry.get(job.type);
      const result = await command.execute(job.payload);
      job.status = JobStatus.COMPLETED;
    } catch (error) {
      job.attempts++;
      if (job.attempts >= job.definition.maxRetries) {
        job.status = JobStatus.FAILED;
        this.dlq.add(job); // Dead letter queue
      } else {
        const delay = Math.pow(2, job.attempts) * 1000; // Exponential backoff
        job.scheduledAt = new Date(Date.now() + delay);
        job.status = JobStatus.PENDING;
        this.queue.enqueue(job);
      }
    }
  }
}`}</pre>
      <h2>Cron Scheduling</h2>
      <pre>{`class CronScheduler {
  schedule(jobType: string, cronExpression: string, payload: any) {
    const definition = new RecurringJobDefinition(jobType, cronExpression, payload);
    this.definitions.save(definition);
  }

  tick() { // Called every minute
    const due = this.definitions.filter(d => this.isDue(d.cronExpression));
    due.forEach(d => this.queue.enqueue(new Job(d)));
  }
}`}</pre>
    </>
  );
}
