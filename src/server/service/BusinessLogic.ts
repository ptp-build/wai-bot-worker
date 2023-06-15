import { Client } from './Client';

export class BusinessLogic {
  private client: Client | null;

  constructor() {
    this.client = null;
  }

  setClient(client: Client): void {
    this.client = client;
  }

  async processMessage(msg: Buffer) {
    if (!this.client) {
      throw new Error('no client ');
    }

  }
}
