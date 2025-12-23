import { Tokens } from '../../../domain/interfaces/tokens.interface';
import { Preference } from '../../../domain/preference.entity';
import { Cursor } from '../../../domain/types/shared';
import { User } from '../../../domain/user.entity';

export interface SuccessResponseDto {
  id: string;
  statusCode: number;
  message: string;
}

export interface UserResponseDto {
  User: User;
  statusCode: number;
  message: string;
}

export interface VerifiedEmailResponseDto {
  User: {
    verifyEmail: boolean;
  };
  statusCode: number;
  message: string;
}

export interface AuthResponseDto {
  Auth: Tokens;
  statusCode: number;
  message: string;
}

export class UserListResponseDto {
  User: User[];
  status: number;
  message: string;
}


export interface PaginatedResult<T> {
  items: T[];
  count: number;
  nextCursor?: Cursor;
}

export type GetUsersResult = PaginatedResult<User>;

export type GetPreferencesResult = PaginatedResult<Preference>;

export interface CreatePreferenceResult {
  ids: string[];
}

export interface GetResult<T> {
  product: T;
}