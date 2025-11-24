import { Controller, Post, Body } from '@nestjs/common';
import { LoginUseCase } from '../application/login.application';
import { LoginDto } from '../application/dto/request/login.dto';
import { RegisterDto } from '../application/dto/request/register.dto';
import { RegisterUseCase } from '../application/register.application';
import { VerifyEmailUseCase } from '../application/verify-email.application';
import { VerifyEmailDto } from '../application/dto/request/verify-email.dto';
import { VerifyCodeDto } from '../application/dto/request/verify-code.dto';
import { VerifyCodeUseCase } from '../application/verify-code.application';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly verifyCodeUseCase: VerifyCodeUseCase,
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
}
