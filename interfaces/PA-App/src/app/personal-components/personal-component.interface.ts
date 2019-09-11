import { OnInit } from '@angular/core';

export interface PersonalComponent extends OnInit {
  /**
   * The state of the whole component.
   * When there is no interaction possible anymore.
   */
  isDisabled: boolean;

  /**
   * Angular default component initialisation
   */
  ngOnInit(): void;

  /**
   * Provide the name of the next section to be loaded/shown.
   * This can contain logic to base the decision on user input, etc.
   */
  getNextSection(): string;

  /**
   * Mark the component as 'done'.
   * This should include a call to `this.conversationService.onSectionCompleted()`
   */
  complete(): void;
}