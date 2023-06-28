import BaseOpenAPIRoute from '../services/BaseOpenAPIRoute';
import DbStorage from "../services/db/DbStorage";

export class DevAction extends BaseOpenAPIRoute {
	static schema = {
		tags: ['Dev'],
		parameters: {
		},
		responses: {
			'200': {
				schema: {},
			},
		},
	};

	async handle(request: Request, data: Record<string, any>) {
    const tables = await DbStorage.getInstance().query("show tables;")
    const tableRow = await DbStorage.getInstance().query("select * from products;")
    const table = await DbStorage.getInstance().query("desc products;")
    console.log({
      tables,
      table,
      tableRow
    })
		return {
      tables,
      table,
      tableRow
    }
	}
}
