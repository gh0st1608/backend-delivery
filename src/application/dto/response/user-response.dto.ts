import { User } from '../../../domain/user.entity';

/**
 * Vista pública del usuario: nunca expone el hash de la contraseña,
 * el código de verificación ni el refresh token.
 */
export interface PublicUserDto {
  userId: string;
  name: string;
  lastname: string;
  email: string;
  photo: string;
  roles: string;
  onboardingRequired: boolean;
  hasPassword: boolean;
  active: boolean;
  createdAt: Date;
}

export const toUserResponse = (user: User): PublicUserDto => {
  const props = user.properties();

  return {
    userId: props.userId,
    name: props.name,
    lastname: props.lastname ?? '',
    email: props.email,
    photo: props.photo ?? '',
    roles: props.roles,
    onboardingRequired: props.onboardingRequired ?? true,
    hasPassword: !!props.password,
    active: props.active ?? true,
    createdAt: props.createdAt,
  };
};
