import BaseOpenAPIRoute from '../services/BaseOpenAPIRoute';
import { SupabaseDb } from '../services/db/SupabaseDb';
import { MySqlPlanetScale } from '../services/db/MySqlPlanetScale';
import { PgSqlNeon } from '../services/db/PgSqlNeon';

export class StageSupabaseDbAction extends BaseOpenAPIRoute {
	static schema = {
		tags: ['Stage'],
		parameters: {
		},
		responses: {
			'200': {
				schema: {},
			},
		},
	};

	async handle(request: Request, data: Record<string, any>) {
		return new SupabaseDb().query("countries","*")
	}
}
export class StageMysqlPlanetscalAction extends BaseOpenAPIRoute {
	static schema = {
		tags: ['Stage'],
		parameters: {
		},
		responses: {
			'200': {
				schema: {},
			},
		},
	};

	async handle(request: Request, data: Record<string, any>) {
		return await new MySqlPlanetScale().query('SELECT * FROM products;')
	}
}

export class StagePgSqlNeonAction extends BaseOpenAPIRoute {
	static schema = {
		tags: ['Stage'],
		parameters: {
		},
		responses: {
			'200': {
				schema: {},
			},
		},
	};

	async handle(request: Request, data: Record<string, any>) {
		return await new PgSqlNeon().query('SELECT * FROM elements;')
	}
}
