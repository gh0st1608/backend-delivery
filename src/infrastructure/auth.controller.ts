import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LoginUseCase } from '../application/login.application';
import { LoginDto } from '../application/dto/request/login.dto';
import { RegisterDto } from '../application/dto/request/register.dto';
import { RegisterUseCase } from '../application/register.application';
import { VerifyEmailUseCase } from '../application/verify-email.application';
import { VerifyEmailDto } from '../application/dto/request/verify-email.dto';
import { VerifyCodeDto } from '../application/dto/request/verify-code.dto';
import { VerifyCodeUseCase } from '../application/verify-code.application';
import { SetPasswordDto } from '../application/dto/request/set-password.dto';
import { SetPasswordUseCase } from '../application/set-password.application';
import { CreatePreferencesUseCase } from '../application/create-preference.application';
import { GetPreferencesUseCase } from '../application/get-preference.application';
import { CreatePreferenceDto } from '../application/dto/request/create-preference.dto';
import { GetByParamsDto } from '../application/dto/request/get-by-params.dto';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { Entities } from '../domain/types/shared';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { GetUsersUseCase } from '../application/get-users.application';
import { GetUserByIdUseCase } from '../application/get-user-by-id.application';
import { GetMeUseCase } from '../application/get-me.application';
import { AccessTokenGuard } from './access-token.guard';
import { AuthenticatedUser } from '../domain/interfaces/security.interface';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly verifyCodeUseCase: VerifyCodeUseCase,
    private readonly setPasswordUseCase: SetPasswordUseCase,
    private readonly createPreferenceUseCase: CreatePreferencesUseCase,
    private readonly getPreferencesUseCase: GetPreferencesUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getUserByIddUseCase: GetUserByIdUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.loginUseCase.execute(body);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.registerUseCase.execute(body);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.verifyEmailUseCase.execute(body);
  }

  @Post('verify-code')
  async verifyCode(@Body() body: VerifyCodeDto) {
    return this.verifyCodeUseCase.execute(body);
  }

  @Post('set-password')
  async setPassword(@Body() body: SetPasswordDto) {
    return this.setPasswordUseCase.execute(body);
  }

  @Post('preferences')
  async save(@Body() body: CreatePreferenceDto) {
    const preferencesIds = await this.createPreferenceUseCase.execute(body);
    return this.ok(
      Entities.PREFERENCE,
      preferencesIds,
      DomainSuccessMessages.CREATE_PREFERENCE_SUCCESS,
    );
  }

  @Get('users')
  async getUsers(@Query() query: GetByParamsDto) {
    const users = await this.getUsersUseCase.execute(query);
    return this.okPaginated(
      users.items,
      users.count,
      users.nextCursor,
      DomainSuccessMessages.GET_USERS_SUCESS,
    );
  }

  @Get('users/:id')
  async getById(@Param('id') id: string) {
    const { user } = await this.getUserByIddUseCase.execute(id);

    return this.ok(Entities.USER, user, DomainSuccessMessages.GET_USER_SUCESS);
  }

  @Get('preferences')
  async getPreferences(@Query() query: GetByParamsDto) {
    const preferences = await this.getPreferencesUseCase.execute(query);
    return this.okPaginated(
      preferences.items,
      preferences.count,
      preferences.nextCursor,
      DomainSuccessMessages.GET_PREFERENCES_SUCCESS,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const { userId } = currentUser;
    const { user } = await this.getMeUseCase.execute(userId);
    return this.ok(Entities.USER, user, DomainSuccessMessages.GET_USER_SUCESS);
  }

  private ok<T>(key: string, data: T, message: string) {
    return {
      [key]: data,
      statusCode: HttpStatusResponse.OK,
      message,
    };
  }

  private okPaginated<T>(
    items: T[],
    count: number,
    nextCursor?: string,
    message?: string,
  ) {
    return {
      items,
      count,
      nextCursor,
      statusCode: HttpStatusResponse.OK,
      message,
    };
  }
}
