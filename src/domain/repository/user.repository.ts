import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { User, UserPropertiesUpdate } from '../user.entity';

export interface UserRepository {
  findByEmail(email: string): Promise<User>;
  findById(id: string): Promise<User>;
  getList(query: GetByParamsDto): Promise<PaginatedResult<User>>;
  save(user: User): Promise<string>;
  update(userId: string, data: UserPropertiesUpdate): Promise<void>;
}

export const UserRepositorySymbol = Symbol('UserRepository');
