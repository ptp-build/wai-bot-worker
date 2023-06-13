import { Client } from './Client';

export class BusinessLogic {
  private client: Client | null;

  constructor() {
    this.client = null;
  }

  setClient(client: Client): void {
    this.client = client;
  }

  processMessage(message: Buffer): void {
    if (!this.client) {
      throw new Error('no client ');
    }

    console.log('Processing message:', Buffer.from(message));
    // const responseMessage = 'Response message';
    this.client.send(message);
  }
}
