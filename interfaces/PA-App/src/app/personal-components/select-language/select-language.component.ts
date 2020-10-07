import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { environment } from 'src/environments/environment';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-select-language',
  templateUrl: './select-language.component.html',
  styleUrls: ['./select-language.component.scss'],
})
export class SelectLanguageComponent extends PersonalComponent {
  @Input()
  public data: any;

  public languages: any;
  public languageChoice: string;
  public languageChoiceName: string;

  constructor(
    public paData: PaDataService,
    public translate: TranslateService,
    public conversationService: ConversationService,
  ) {
    super();
  }

  ngOnInit() {
    this.languages = this.getEnabledLanguages();

    if (this.data) {
      this.initHistory();
    }
  }

  async initHistory() {
    this.languageChoice = this.data.languageChoice;
    this.languageChoiceName = this.getLanguageName(this.data.languageChoice);
    await this.translate.use(this.languageChoice).toPromise();
    this.isDisabled = true;
  }

  private getEnabledLanguages() {
    const enabledLocales = environment.locales.trim().split(/\s*,\s*/);

    return enabledLocales.map((locale: string) => {
      const languageKey = 'personal.select-language.language.' + locale;
      const introductionKey = 'personal.select-language.introduction.' + locale;
      return {
        id: locale,
        languageKey,
        language: this.translate.instant(languageKey),
        introductionKey,
        introduction: this.translate.instant(introductionKey),
      };
    });
  }

  public getLanguageName(languageId: string): string {
    const language = this.languages.find((item) => {
      return item.id === languageId;
    });

    return language ? language.language : '';
  }

  public changeLanguage($event) {
    this.languageChoice = $event.detail.value;
    if (this.isDisabled) {
      return;
    }

    this.translate.use(this.languageChoice);
    this.languageChoiceName = this.getLanguageName(this.languageChoice);

    this.paData.store(this.paData.type.language, this.languageChoice, true);
  }

  public submitLanguage() {
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.selectProgram;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectLanguage,
      data: {
        languageChoice: this.languageChoice,
      },
      next: this.getNextSection(),
    });
  }
}
