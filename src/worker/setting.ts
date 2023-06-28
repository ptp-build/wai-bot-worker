export const WAI_SERVER_PORT = 5080

export const SWAGGER_DOC = {
  schema: {
    info: {
      title: 'Worker Wai Chat',
      version: '1.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
};

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
}
