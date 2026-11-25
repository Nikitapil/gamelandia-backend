import { Controller, Get, Header } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags
} from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @Get('healthcheck')
  @ApiOperation({
    operationId: 'healthcheck',
    summary: 'Check API availability'
  })
  @ApiProduces('text/plain')
  @ApiOkResponse({ schema: { type: 'string', enum: ['OK'] } })
  @Header('Content-Type', 'text/plain')
  async healthcheck() {
    return 'OK';
  }
}
