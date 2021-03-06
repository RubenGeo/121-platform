import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonContent, IonicModule } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { fspData, mockProgram } from 'src/app/mocks/api.program.mock';
import { PaDataAttribute } from 'src/app/models/pa-data.model';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SessionStorageType } from 'src/app/services/session-storage-types.enum';
import { SessionStorageService } from 'src/app/services/session-storage.service';
import { ValidateFspComponent } from './validate-fsp.component';

describe('ValidateFspComponent', () => {
  let component: ValidateFspComponent;
  let fixture: ComponentFixture<ValidateFspComponent>;

  beforeEach(async(() => {
    const programsServiceApiServiceMock = jasmine.createSpyObj(
      'ProgramsServiceApiService',
      {
        getProgramById: () => of(mockProgram).toPromise(),
        getPrefilledAnswers: () => of({}).toPromise(),
        getFspAttributesAsnwers: () => of(fspData).toPromise(),
      },
    );

    const sessionStorageServiceMock = {
      type: SessionStorageType,
      retrieve: (type: SessionStorageType) =>
        new Promise<any>((resolve) => {
          switch (type) {
            case SessionStorageType.paData:
              return resolve(
                JSON.stringify([
                  {
                    did: 'did:sov:example',
                    programId: 1,
                    attributeId: 0,
                    attribute: 'question1',
                    answer: 'answer',
                  } as PaDataAttribute,
                ]),
              );
          }
        }),
      destroyItem: () => of('').toPromise(),
    };

    const ionContentMock = jasmine.createSpyObj('IonContent', [
      'scrollToBottom',
    ]);

    const ionicStorageMock = {
      get: (type: IonicStorageTypes) =>
        new Promise<any>((resolve) => {
          switch (type) {
            case IonicStorageTypes.myPrograms:
              return resolve([mockProgram]);
            case IonicStorageTypes.credentials:
              return resolve([{ did: '', programId: 1, attributes: [] }]);
            default:
              return resolve('1');
          }
        }),
    };

    TestBed.configureTestingModule({
      declarations: [ValidateFspComponent],
      imports: [
        TranslateModule.forRoot(),
        IonicModule.forRoot(),
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: programsServiceApiServiceMock,
        },
        {
          provide: SessionStorageService,
          useValue: sessionStorageServiceMock,
        },
        {
          provide: IonContent,
          useValue: ionContentMock,
        },
        {
          provide: Storage,
          useValue: ionicStorageMock,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidateFspComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
