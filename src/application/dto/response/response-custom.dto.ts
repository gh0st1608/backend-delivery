import { Tokens } from '../../../domain/interfaces/tokens.interface';
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
