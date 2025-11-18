export const EmailRepositorySymbol = Symbol('EmailRepository');

export interface EmailRepository {
  sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<boolean>;
}
