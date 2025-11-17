import { User } from '../user.entity';

export interface UserRepository {
  findByEmail(email : string): Promise<User>;
  save(user: User): Promise<void>;
}

export const UserRepositorySymbol = Symbol(
  'UserRepository',
);
