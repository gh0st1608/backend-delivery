import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { fromIni } from '@aws-sdk/credential-providers';

export const getAwsCredentials = ():
  | AwsCredentialIdentityProvider
  | undefined => {

  if (process.env.AWS_LOCAL === 'true') {
    return fromIni({ profile: 'default' });
  }

  return undefined;
};