export default abstract class BaseKv {
  abstract init(db: any):void;
  abstract get(key: string, force?: boolean): Promise<any>;
  abstract put(key: string, value: any): Promise<boolean>;
  abstract delete(key: string): Promise<boolean>;
}
