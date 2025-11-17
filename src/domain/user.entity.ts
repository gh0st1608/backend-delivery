import { v4 as uuidv4 } from 'uuid';

export interface UserRequired {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly roles: string;
  //readonly roles: string[] | unknown[];
}

export interface UserOptional {
  readonly id: string;
  readonly lastname: string;
  readonly photo: string;
  readonly active: boolean;
  readonly refreshToken: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date;
}

export type UserProperties = UserRequired & Partial<UserOptional>;

export type UserPropertiesUpdate = Partial<
  Omit<UserRequired, ''> & Pick<UserOptional, 'photo'>
>;

export class User {
  private id : string;
  private name: string;
  private lastname: string;
  private readonly email: string;
  private password: string;
  private photo: string;
  private roles: string;
  private active: boolean;
  private refreshToken: string;
  private readonly createdAt: Date;
  private updatedAt: Date | null;
  private deletedAt: Date | null;

  constructor(properties: UserProperties) {
    this.active = true;
    Object.assign(this, properties);
  }

  properties(): UserProperties {
    return {
      id: this.id,
      name: this.name,
      lastname: this.lastname,
      email: this.email,
      password: this.password,
      photo: this.photo,
      roles: this.roles,
      active: this.active,
      refreshToken: this.refreshToken,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  static create(data: {
    name: string;
    email: string;
    password: string;
    roles: string;
    lastname?: string;
    photo?: string;
  }): User {
    const now = new Date();

    return new User({
      id: uuidv4(),
      name: data.name,
      email: data.email,
      password: data.password,
      roles: data.roles,
      lastname: data.lastname ?? '',
      photo: data.photo ?? '',
      active: true,
      refreshToken: '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  update(properties: UserPropertiesUpdate): User {
    this.active = true;
    return Object.assign(this, properties);
  }
}
