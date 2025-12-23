import { Controller, Post, Body, Get, Query } from '@nestjs/common';
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

  @Post('users/preferences')
  async save(
    @Body() body: CreatePreferenceDto,
  ) {
    const preferencesIds = await this.createPreferenceUseCase.execute(body);
    return this.ok(
      Entities.PREFERENCE,
      preferencesIds,
      DomainSuccessMessages.CREATE_PREFERENCE_SUCCESS,
    );
  }

  @Get('users/preferences')
  async get(@Query() query: GetByParamsDto) {
    const preferences = await this.getPreferencesUseCase.execute(query);
     return this.okPaginated(
      preferences.items,
      preferences.count,
      preferences.nextCursor,
      DomainSuccessMessages.GET_PREFERENCES_SUCCESS,
    );

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
