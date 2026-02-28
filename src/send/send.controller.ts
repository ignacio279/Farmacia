import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendDto } from './dto/send.dto';
import { SendService } from './send.service';

@Controller('send')
export class SendController {
  constructor(
    private config: ConfigService,
    private sendService: SendService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async send(
    @Headers('x-api-key') apiKey: string,
    @Body() body: SendDto,
  ) {
    const expectedKey = this.config.get<string>('send.apiKey');
    if (expectedKey && apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    const to = body.to.replace(/\D/g, '');
    if (!to || to.length < 10) {
      throw new BadRequestException('Invalid phone number');
    }
    await this.sendService.send(to, body.text);
  }
}
