import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, LessThan, Repository, In, Between } from 'typeorm';
import { IntersolveBarcodeEntity } from '../programs/fsp/intersolve-barcode.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { WhatsappService } from '../notifications/whatsapp/whatsapp.service';
import { IntersolveRequestEntity } from 'src/programs/fsp/intersolve-request.entity';
import { IntersolveResultCode } from 'src/programs/fsp/api/enum/intersolve-result-code.enum';
import { IntersolveApiService } from 'src/programs/fsp/api/instersolve.api.service';

@Injectable()
export class CronjobService {
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
  >;

  private readonly intersolveRequestRepository: Repository<
    IntersolveRequestEntity
  >;

  public constructor(
    private whatsappService: WhatsappService,
    private readonly intersolveApiService: IntersolveApiService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  private async cronSendWhatsappReminders(): Promise<void> {
    console.log('Execution Started: cronSendWhatsappReminders');

    const programId = 1;
    const language = 'en';
    const sixteenHours = 16 * 60 * 60 * 1000;
    const sixteenHoursAgo = (d =>
      new Date(d.setTime(d.getTime() - sixteenHours)))(new Date());

    const program = await getRepository(ProgramEntity).findOne(programId);
    const unsentIntersolveBarcodes = await this.intersolveBarcodeRepository.find(
      {
        where: { send: false, timestamp: LessThan(sixteenHoursAgo) },
      },
    );

    unsentIntersolveBarcodes.forEach(async unsentIntersolveBarcode => {
      const whatsappPayment =
        program.notifications[language]['whatsappPayment'];
      const fromNumber = unsentIntersolveBarcode.whatsappPhoneNumber;
      await this.whatsappService.sendWhatsapp(
        whatsappPayment,
        fromNumber,
        null,
      );
    });

    console.log(
      `cronSendWhatsappReminders: ${unsentIntersolveBarcodes.length} unsent Intersolve barcodes`,
    );
    console.log('Execution Complete: cronSendWhatsappReminders');
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  private async cronCancelByRefposIntersolve(): Promise<void> {
    // This function periodically checks if some of the IssueCard calls failed.
    // and tries to cancel the
    console.log('Execution Started: cancelByRefposIntersolve');

    // If we get one of these codes back from a cancel by refpos, stop cancelling
    const stopCancelByRefposCodes = [
      IntersolveResultCode.Ok,
      IntersolveResultCode.InvalidOrUnknownRetailer,
      IntersolveResultCode.UnableToCancel,
    ];

    const tenMinutes = 10 * 60 * 1000;
    const tenMinutesAgo = (d => new Date(d.setTime(d.getTime() - tenMinutes)))(
      new Date(),
    );

    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = (d => new Date(d.setTime(d.getTime() - twoWeeks)))(
      new Date(),
    );

    const failedIntersolveRquests = await this.intersolveRequestRepository.find(
      {
        where: {
          resultCodeIssueCard: !IntersolveResultCode.Ok,
          updated: Between(twoWeeksAgo, tenMinutesAgo),
          cancelled: false,
          cancelByRefposrResultCode: !In(stopCancelByRefposCodes),
        },
      },
    );
    for (let intersolveRequest of failedIntersolveRquests) {
      this.cancelRequestRefpos(intersolveRequest);
    }

    console.log('Execution Complete: cancelByRefposIntersolve');
  }
  public async cancelRequestRefpos(
    intersolveRequest: IntersolveRequestEntity,
  ): Promise<void> {
    intersolveRequest.cancellationAttempts =
      intersolveRequest.cancellationAttempts + 1;
    try {
      const cancelByRefPosResponse = await this.intersolveApiService.cancelTransactionByRefPos(
        intersolveRequest.refPos,
      );
      intersolveRequest.cancelByRefPosResultCode =
        cancelByRefPosResponse.resultCode;
      if (cancelByRefPosResponse.resultCode === IntersolveResultCode.Ok) {
        intersolveRequest.isCancelled = true;
      }
    } catch (Error) {
      console.log('Error cancelling by refpos id', Error, intersolveRequest);
    }
    intersolveRequest.updated = null;
    await this.intersolveRequestRepository.save(intersolveRequest);
  }
}
