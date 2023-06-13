export abstract class Server {
  constructor(protected port: number) {}

  abstract start(): void;
}
