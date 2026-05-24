import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateCourierUseCase } from '../../application/use-cases/create-courier.usecase';
import { CreateCourierDto } from '../../application/dto/request/create-courier.dto';
import { GetCourierByIdUseCase } from '../../application/use-cases/get-courier-by-id.usecase';
import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { DomainSuccessMessages } from '../../domain/constants/messages';
import { HttpStatusResponse } from '../../domain/constants/http-code';
import { Entities } from '../../domain/constants/enums';
import { GetCouriersUseCase } from '../../application/use-cases/get-couriers.usecase';
import { UpdateCourierPresenceUseCase } from '../../application/use-cases/update-courier-presence.usecase';
import { UpdateCourierPresenceDto } from '../../application/dto/request/update-courier-presence.dto';

@Controller('courier')
export class CourierController {
  constructor(
    private readonly getCouriersUseCase: GetCouriersUseCase,
    private readonly getCourierByIdUseCase: GetCourierByIdUseCase,
    private readonly createCourierUseCase: CreateCourierUseCase,
    private readonly updateCourierPresenceUseCase: UpdateCourierPresenceUseCase,
  ) {}

  @Get(':courierId')
  async getById(@Param('courierId') courierId: string) {
    const { courier } = await this.getCourierByIdUseCase.execute(courierId);
    return this.ok(
      Entities.COURIER,
      courier,
      DomainSuccessMessages.GET_COURIER_SUCESS,
    );
  }

  @Post()
  async create(@Body() dto: CreateCourierDto) {
    const courierId = await this.createCourierUseCase.execute(dto);
    return this.ok(
      Entities.COURIER,
      courierId,
      DomainSuccessMessages.GET_COURIER_SUCESS,
    );
  }

  @Get()
  async getList(@Query() query: GetByParamsDto) {
    const users = await this.getCouriersUseCase.execute(query);
    return this.okPaginated(
      users.items,
      users.count,
      users.nextCursor,
      DomainSuccessMessages.GET_COURIER_SUCESS,
    );
  }

  @Patch(':courierId/presence')
  async updatePresence(
    @Param('courierId') courierId: string,
    @Body() dto: UpdateCourierPresenceDto,
  ) {
    const courier = await this.updateCourierPresenceUseCase.execute(
      courierId,
      dto,
    );

    return this.ok(
      Entities.COURIER,
      courier,
      DomainSuccessMessages.UPDATE_COURIER_SUCCESS,
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
