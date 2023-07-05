


export const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

export function getCorsOptionsHeader(Access_Control_Allow_Origin: string = '*') {
  return {
    'Access-Control-Allow-Origin': Access_Control_Allow_Origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, ApiKey, Token',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function getCorsHeader(
  Access_Control_Allow_Origin: string = '*',
  ContentType: string = 'application/json;charset=UTF-8'
) {
  return {
    'content-type': ContentType,
    'Access-Control-Allow-Origin': Access_Control_Allow_Origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

export function ResponseJson(result: object, status = 200,Access_Control_Allow_Origin: string = '*') {
  return new Response(JSON.stringify(result), {
    status,
    headers: {
      ...getCorsHeader(Access_Control_Allow_Origin),
    },
  });
}

export function parseQueryFromUrl(urlStr: string): { url: URL; query: Record<string, string> } {
  const replacedUrl = urlStr.replace(/#/g, '?');
  const url = new URL(replacedUrl);
  const query = Array.from(url.searchParams.entries()).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value,
    }),
    {}
  );

  return { url, query };
}
