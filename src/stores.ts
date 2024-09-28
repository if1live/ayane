import {
  BatchWriteItemCommand,
  type DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  type WriteRequest,
} from "@aws-sdk/client-dynamodb";
import type { ServiceHealth, TouchSettledResult } from "./types.js";

const tableName = "AyaneKeyValue";

export async function deleteResult(dynamodb: DynamoDBClient) {
  const output = await dynamodb.send(new ScanCommand({ TableName: tableName }));
  const items = output.Items ?? [];

  if (items.length > 0) {
    const requests = items.map((item): WriteRequest => {
      return {
        DeleteRequest: {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          Key: { label: item.label! },
        },
      };
    });

    await dynamodb.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: requests,
        },
      }),
    );
    // console.log(`Deleted ${requests.length} items from ${tableName}`);
  } else {
    // console.log("No items found");
  }
}

export async function saveResult(
  dynamodb: DynamoDBClient,
  label: string,
  result: TouchSettledResult<object | boolean>,
) {
  const health = transform(result);
  switch (health.tag) {
    case "ignore": {
      // redis 명령을 아끼려고 아무것도 하지 않는다
      break;
    }
    default: {
      const text = JSON.stringify(health);
      await dynamodb.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            label: { S: label },
            text: { S: text },
            updatedAt: { S: new Date().toISOString() },
          },
        }),
      );
      break;
    }
  }
}

export async function loadResults(
  dynamodb: DynamoDBClient,
): Promise<Array<{ label: string; health: ServiceHealth }>> {
  const output = await dynamodb.send(new ScanCommand({ TableName: tableName }));
  if (!output.Items) {
    return [];
  }

  const results = [];
  for (const entry of output.Items) {
    const label: string = entry.label?.S ?? "";
    const text: string = entry.text?.S ?? "";

    const health: ServiceHealth =
      typeof text === "string" ? JSON.parse(text) : (text as unknown);

    results.push({ label, health });
  }
  return results;
}

export async function loadSortedResults(
  dynamodb: DynamoDBClient,
): Promise<Array<{ label: string; health: ServiceHealth }>> {
  const entries = await loadResults(dynamodb);

  // hgetall로 얻은 결과의 순서가 보장되지 않는다.
  // 데이터가 그대로인데 새로고침 할때마다 내용이 바뀌는건 원한게 아니다.
  // 그래서 직접 정렬
  const sortedEntries = entries.sort((a, b) => a.label.localeCompare(b.label));
  return sortedEntries;
}

function transform(
  result: TouchSettledResult<object | boolean>,
): ServiceHealth {
  const timestamp = result.at.getTime();
  const skel = { timestamp } as const;

  if (result.status === "rejected") {
    const reason = result.reason;
    return {
      ...skel,
      tag: "error",
      reason: {
        name: reason.name,
        message: reason.message,
      },
    };
  }

  const { value } = result;
  return typeof value === "boolean"
    ? { ...skel, tag: "ignore" }
    : { ...skel, tag: "ok", value };
}
