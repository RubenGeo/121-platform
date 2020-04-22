import { Component, OnInit, ViewChild } from '@angular/core';
import QrScanner from 'qr-scanner';

@Component({
  selector: 'qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
})
export class QrScannerComponent implements OnInit {
  @ViewChild('video')
  videoElem: any;
  result: any;

  constructor() { }

  ngOnInit() {
    QrScanner.WORKER_PATH = './assets/qr-scanner-worker.min.js';
    const qrScanner = new QrScanner(this.videoElem.nativeElement, result => {
      this.result = result;
    });
    qrScanner.start();
  }
}
