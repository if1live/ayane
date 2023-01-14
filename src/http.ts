import { RequestLike } from "itty-router";
import { APIGatewayProxyEventV2, Context } from "aws-lambda";

// itty-router + custom field
export type MyRequest = {
  method: string;
  url: string;
  params: {
    [key: string]: string;
  };
  query: {
    [key: string]: string | string[] | undefined;
  };
} & RequestExtend;

interface RequestExtend {
  headers: APIGatewayProxyEventV2["headers"];
  body?: APIGatewayProxyEventV2["body"];
  json?: unknown;
  apiGateway: {
    event: APIGatewayProxyEventV2;
    context: Context;
  };
}

function parseJsonBody(event: APIGatewayProxyEventV2): unknown | undefined {
  if (!event.body) return undefined;
  if (event.headers["content-type"] !== "application/json") return undefined;

  try {
    return JSON.parse(event.body);
  } catch (e) {
    return undefined;
  }
}

export function createRouterRequest(
  event: APIGatewayProxyEventV2,
  context: Context
): RequestLike {
  const host = event.requestContext.domainName;
  const http = event.requestContext.http;
  const url = `http://${host}${http.path}?${event.rawQueryString}`;
  const json = parseJsonBody(event);

  const requestExtend: RequestExtend = {
    body: event.body,
    headers: event.headers,
    json,
    apiGateway: { event, context },
  };

  return {
    method: http.method,
    url,
    ...requestExtend,
  };
}
