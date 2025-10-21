import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { QueueService } from './queue.service';
import { EnterQueueDto } from './dto/enter-queue.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('enter')
  async enterQueue(@Body() enterQueueDto: EnterQueueDto) {
    return this.queueService.enterQueue(enterQueueDto);
  }

  @Get(':barberId')
  async getQueue(@Param('barberId') barberId: string) {
    return this.queueService.getQueue(parseInt(barberId));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.queueService.updateStatus(parseInt(id), updateStatusDto);
  }

  @Get(':id/position')
  async getPosition(@Param('id') id: string) {
    return this.queueService.getPosition(parseInt(id));
  }

  @Get(':barberId/updates')
  async getQueueUpdates(@Param('barberId') barberId: string) {
    const queue = await this.queueService.getQueue(parseInt(barberId));
    return {
      timestamp: new Date().toISOString(),
      queue_length: queue.length,
      queue,
    };
  }
}
