import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanCustomQrComponent } from './scan-custom-qr.component';

describe('ScanCustomQrComponent', () => {
  let component: ScanCustomQrComponent;
  let fixture: ComponentFixture<ScanCustomQrComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScanCustomQrComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanCustomQrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
