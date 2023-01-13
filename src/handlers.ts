import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const http: APIGatewayProxyHandlerV2 = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(event, null, 2),
  };
};
