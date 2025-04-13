
import prisma from "../../lib/prisma";

class DatabaseQueue {
  constructor({ flushInterval = 3000, batchSize = 10 } = {}) {
    this.queue = [];
    this.flushInterval = flushInterval;  // 3000ms -> 3s
    this.batchSize = batchSize;         

    setInterval(() => this.flush(), this.flushInterval);
  }

  enqueue(logEntry) {
    this.queue.push(logEntry);
    
    // If the number of queued logs reaches the batch size, flush immediately
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) {
      return; 
    }

    // Take a batch of logs to insert
    const batch = this.queue.splice(0, this.batchSize);
    try {
      // Insert logs in bulk using Prisma's createMany method
      await prisma.logs.createMany({ data: batch });
    } catch (error) {
      console.error("Error flushing log batch to DB:", error);
    }
  }
}

export default new DatabaseQueue({ flushInterval: 5000, batchSize: 10 });





