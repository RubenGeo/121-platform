import { Storage } from '@ionic/storage';
import { SessionStorageService } from './../../services/session-storage.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ValidationComponents } from '../validation-components.enum';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { TimeoutError } from 'rxjs';
import { PaQrCode } from 'src/app/models/pa-qr-code.model';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.scss'],
})
export class ScanQrComponent implements ValidationComponent {
  public scanError = false;
  public paDataResult = false;
  public unknownDidCombination = false;
  public returnMainMenu = false;

  public ionicStorageTypes = IonicStorageTypes;

  constructor(
    private router: Router,
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public sessionStorageService: SessionStorageService,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    this.scanQrCode();
  }

  public async scanQrCode() {
    const storageSubscription = this.sessionStorageService
      .watchStorage()
      .subscribe(async (response) => {
        // Only respond to scannedData changes:
        if (response !== this.sessionStorageService.type.scannedData) {
          return;
        }

        this.conversationService.startLoading();
        await this.sessionStorageService
          .retrieve(this.sessionStorageService.type.scannedData)
          .then((data) => this.checkScannedData(data))
          .finally(() => {
            // Always reset the scanned-data
            this.sessionStorageService.destroyItem(
              this.sessionStorageService.type.scannedData,
            );
          });
        this.conversationService.stopLoading();

        storageSubscription.unsubscribe();
      });
    this.router.navigate(['/scan-qr']);
  }

  private async checkScannedData(data: string) {
    const paIdentifier = await this.getPaIdentifier(data);

    if (!paIdentifier) {
      this.scanError = true;
      return;
    }

    this.scanError = false;

    const paData = await this.findPaData(
      paIdentifier.did,
      paIdentifier.programId,
    );

    if (!paData) {
      this.unknownDidCombination = true;
      return;
    }

    this.storePaData(paData);
    this.foundCorrectPaData();
  }

  private isJson(str: string): boolean {
    try {
      JSON.parse(str);
    } catch {
      return false;
    }
    return true;
  }

  private isPaQrCode(data: any): data is PaQrCode {
    return data.did !== undefined && data.programId !== undefined;
  }

  private isValidPaQrCode(data: string): boolean {
    if (!this.isJson(data)) {
      return false;
    }

    return this.isPaQrCode(JSON.parse(data));
  }

  private async getPaIdentifier(data: string): Promise<PaQrCode | false> {
    if (this.isValidPaQrCode(data)) {
      return JSON.parse(data);
    }

    const didProgramId = {
      did: undefined,
      programId: 1, // Hard-code Program ID for now...
    };

    didProgramId.did = await this.getPaIdentifierOffline(data);
    console.log('didProgramId: ', didProgramId);
    if (didProgramId.did) {
      return didProgramId;
    }
    try {
      didProgramId.did = await this.getPaIdentifierOnline(data);
      return didProgramId;
    } catch {
      return false;
    }
  }

  private async getPaIdentifierOffline(data: string): Promise<string> {
    console.log('getPaIdentifierOffline');
    const qrDidMapping = await this.storage.get(
      this.ionicStorageTypes.qrDidMapping,
    );
    if (!qrDidMapping || !qrDidMapping.length) {
      return;
    }
    for (const element of qrDidMapping) {
      if (data === element.qrIdentifier) {
        return element.did;
      }
    }
  }


  private async getPaIdentifierOnline(data: string): Promise<string> {
    console.log('getPaIdentifierOnline');
    try {
      const response = await this.programsService.getDidByQrIdentifier(data);
      if (response.length === 0) {
        return;
      }
      return response;
    } catch (e) {
      console.log('Error: ', e.name);
      if (e.status === 0 || e instanceof TimeoutError) {
        return;
      }
    }

  }

  private async findPaData(did: string, programId: number): Promise<any> {
    let paData = await this.findPaDataOffline(did, programId);
    if (!paData) {
      paData = await this.findPaDataOnline(did, programId);
    }
    return paData;
  }

  private async findPaDataOnline(did: string, programId: number): Promise<any> {
    try {
      const response = await this.programsService.getPrefilledAnswers(
        did,
        programId,
      );
      if (response.length === 0) {
        return;
      }
      return response;
    } catch (e) {
      console.log('Error: ', e.name);
      if (e.status === 0 || e instanceof TimeoutError) {
        return;
      }
    }
  }

  private async findPaDataOffline(
    did: string,
    programId: number,
  ): Promise<any> {
    console.log('findPaDataOffline()');
    const offlineData = await this.storage.get(
      this.ionicStorageTypes.validationData,
    );
    if (!offlineData || !offlineData.length) {
      return;
    }
    const prefilledQuestions = [];
    offlineData.forEach((element) => {
      if (did === element.did && programId === element.programId) {
        prefilledQuestions.push(element);
      }
    });
    if (prefilledQuestions.length > 0) {
      return prefilledQuestions;
    }
  }

  private storePaData(paData: any) {
    this.sessionStorageService.store(
      this.sessionStorageService.type.paData,
      JSON.stringify(paData),
    );
  }

  private foundCorrectPaData() {
    this.paDataResult = true;
    this.unknownDidCombination = false;
    this.scanError = false;
    this.complete();
  }

  public backMainMenu() {
    this.returnMainMenu = true;
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.scanQr,
      data: {},
      next: ValidationComponents.mainMenu,
    });
  }

  getNextSection() {
    return ValidationComponents.validateProgram;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.scanQr,
      next: this.getNextSection(),
    });
  }
}
