import { formatDate } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { ProgramPhase } from 'src/app/models/program.model';
import { ProgramPhaseService } from 'src/app/services/program-phase.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-export-list',
  templateUrl: './export-list.component.html',
  styleUrls: ['./export-list.component.scss'],
})
export class ExportListComponent implements OnChanges {
  @Input()
  public programId: number;
  @Input()
  public userRole: UserRole;
  @Input()
  public exportType: ExportType;
  @Input()
  public paymentInstallment: number;
  @Input()
  public paymentExportAvailable: boolean;

  public disabled: boolean;

  public btnText: string;
  public subHeader: string;
  public message: string;

  private locale: string;
  public actionTimestamp: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  constructor(
    private programPhaseService: ProgramPhaseService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = environment.defaultLocale;
  }

  ngOnInit() {
    this.btnText = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.btn-text',
    );
    this.updateSubHeader();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.programId &&
      ['string', 'number'].includes(typeof changes.programId.currentValue)
    ) {
      await this.programPhaseService.getPhases(this.programId);
      this.disabled = !this.btnEnabled();
    }
  }

  async updateSubHeader() {
    await this.getLatestActionTime();
    this.subHeader = this.translate.instant(
      'page.program.export-list.' + this.exportType + '.confirm-message',
    );
    this.message = this.actionTimestamp
      ? this.translate.instant('page.program.export-list.timestamp', {
          dateTime: this.actionTimestamp,
        })
      : '';
  }

  public btnEnabled() {
    const activePhase = this.programPhaseService.getActivePhase();
    if (this.userRole === UserRole.ProgramManager) {
      return false;
    }

    return (
      this.exportType === ExportType.allPeopleAffected ||
      ((activePhase.name === ProgramPhase.reviewInclusion ||
        activePhase.name === ProgramPhase.payment) &&
        this.exportType === ExportType.included) ||
      (activePhase.name === ProgramPhase.registrationValidation &&
        this.exportType === ExportType.selectedForValidation) ||
      (activePhase.name === ProgramPhase.payment &&
        this.exportType === ExportType.payment &&
        this.paymentExportAvailable) ||
      (activePhase.name === ProgramPhase.payment &&
        this.exportType === ExportType.unusedVouchers)
    );
  }

  public getExportList() {
    this.programsService
      .exportList(+this.programId, this.exportType, +this.paymentInstallment)
      .then(
        (res) => {
          if (!res.data) {
            this.actionResult(
              this.translate.instant('page.program.export-list.no-data'),
            );
            return;
          }
          const blob = new Blob([res.data], { type: 'text/csv' });
          saveAs(blob, res.fileName);
          this.updateSubHeader();
        },
        (err) => {
          console.log('err: ', err);
          this.actionResult(this.translate.instant('common.export-error'));
        },
      );
  }

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [this.translate.instant('common.ok')],
    });
    await alert.present();
  }

  public async getLatestActionTime(): Promise<void> {
    const latestAction = await this.programsService.retrieveLatestActions(
      this.exportType,
      Number(this.programId),
    );
    if (latestAction) {
      this.actionTimestamp = formatDate(
        new Date(latestAction.timestamp),
        this.dateFormat,
        this.locale,
      );
    }
  }
}
