import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
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
import { InternalApiKeyGuard } from './internal-api-key.guard';
import { RefreshSessionUseCase } from '../application/refresh-session.application';
import { LogoutUseCase } from '../application/logout.application';
import { RefreshTokenDto } from '../application/dto/request/refresh-token.dto';
import { AuthResponseDto } from '../application/dto/response/response-custom.dto';
import { ForbiddenResourceException } from '../application/exceptions/forbidden-resource.exception';
import { jwtConfig, refreshCookieConfig } from './config/jwt.config';

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
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatusResponse.OK)
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute(body);
    return this.withRefreshTransport(result, req, res);
  }

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.registerUseCase.execute(body);
    return this.withRefreshTransport(result, req, res);
  }

  // Rotación del refresh token. No requiere access token (puede estar vencido).
  @Post('refresh')
  @HttpCode(HttpStatusResponse.OK)
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.refreshSessionUseCase.execute(
        this.readRefreshToken(body, req),
      );
      return this.withRefreshTransport(result, req, res);
    } catch (error) {
      this.clearRefreshCookie(res);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatusResponse.OK)
  async logout(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.logoutUseCase.execute(
      this.readRefreshToken(body, req),
    );
    this.clearRefreshCookie(res);
    return result;
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

  @UseGuards(AccessTokenGuard)
  @Post('preferences')
  async save(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: CreatePreferenceDto,
  ) {
    const preferencesIds = await this.createPreferenceUseCase.execute(
      currentUser.userId,
      body,
    );
    return this.ok(
      Entities.PREFERENCE,
      preferencesIds,
      DomainSuccessMessages.CREATE_PREFERENCE_SUCCESS,
    );
  }

  // Listados completos: solo para la plataforma de administración / servicios internos
  @UseGuards(InternalApiKeyGuard)
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

  // Un usuario solo puede consultar su propio perfil (BOLA / OWASP API1)
  @UseGuards(AccessTokenGuard)
  @Get('users/:id')
  async getById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (currentUser.userId !== id) {
      throw new ForbiddenResourceException();
    }

    const { user } = await this.getUserByIddUseCase.execute(id);
    return this.ok(Entities.USER, user, DomainSuccessMessages.GET_USER_SUCESS);
  }

  @UseGuards(InternalApiKeyGuard)
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

  // =======================
  // REFRESH TOKEN TRANSPORT
  // =======================

  // Web: cookie HttpOnly (inaccesible para JavaScript → mitiga XSS).
  // Móvil: en el body, la app lo guarda en el almacenamiento seguro del SO.
  private isWebClient(req: Request): boolean {
    return req.headers['x-client-type'] === 'web';
  }

  private withRefreshTransport(
    result: AuthResponseDto,
    req: Request,
    res: Response,
  ) {
    if (!this.isWebClient(req)) return result;

    const { name, path, secure, sameSite } = refreshCookieConfig();
    const { refreshTokenTtlSeconds } = jwtConfig();

    res.cookie(name, result.Auth.refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path,
      maxAge: refreshTokenTtlSeconds * 1000,
    });

    const { refreshToken: _omitted, ...auth } = result.Auth;
    return { ...result, Auth: auth };
  }

  private readRefreshToken(body: RefreshTokenDto, req: Request) {
    if (body?.Auth?.refreshToken) return body.Auth.refreshToken;

    const { name } = refreshCookieConfig();
    const cookies = req.headers.cookie ?? '';

    for (const part of cookies.split(';')) {
      const [key, ...value] = part.trim().split('=');
      if (key === name) return decodeURIComponent(value.join('='));
    }

    return undefined;
  }

  private clearRefreshCookie(res: Response) {
    const { name, path, secure, sameSite } = refreshCookieConfig();
    res.clearCookie(name, { httpOnly: true, secure, sameSite, path });
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
