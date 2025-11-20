import { SQSEvent } from "aws-lambda";

export function createMockSqsEvent(body: any): SQSEvent {
  return {
    Records: [
      {
        messageId: 'mock',
        receiptHandle: 'mock',
        body: JSON.stringify(body),
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: Date.now().toString(),
          SenderId: 'mock',
          ApproximateFirstReceiveTimestamp: Date.now().toString(),
        },
        messageAttributes: {},
        md5OfBody: '',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:::mock',
        awsRegion: 'us-east-1',
      },
    ],
  };
}
