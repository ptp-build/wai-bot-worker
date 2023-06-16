export abstract class BaseServer {
  constructor(protected port: number) {}

  abstract start(): void;
}
