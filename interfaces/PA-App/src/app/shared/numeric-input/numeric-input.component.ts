import { Component, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'numeric-input',
  templateUrl: './numeric-input.component.html',
  styleUrls: ['./numeric-input.component.scss'],
})
export class NumericInputComponent {
  @ViewChild('numericInput')
  public numericInput: any;

  @Input()
  public value: string;

  @Input()
  public autocomplete: string;

  @Input()
  public placeholder: string;

  @Input()
  public disabled: boolean;

  constructor() {}

  public async onInput() {
    // 'export' the value of the input-ELEMENT to be used as value of this COMPONENT
    this.value = this.numericInput.value;

    const nativeInput = await this.numericInput.getInputElement();
    let cursorPosition = nativeInput.selectionStart;

    const clean = this.value.replace(/[^0-9]/g, '');

    const strippedLength = this.value.length - clean.length;
    cursorPosition = cursorPosition - strippedLength;

    this.value = clean;
    nativeInput.setSelectionRange(cursorPosition, cursorPosition);
  }
}
