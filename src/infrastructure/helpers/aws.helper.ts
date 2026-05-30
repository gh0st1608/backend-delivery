import { AwsCredentialIdentity } from '@aws-sdk/types';

export const getAwsCredentials = ():
  | AwsCredentialIdentity
  | undefined => {

  if (process.env.AWS_LOCAL === 'true') {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    };
  }

  return undefined;
};