import { Component, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';

@Component({
  selector: 'app-personal',
  templateUrl: 'personal.page.html',
  styleUrls: ['personal.page.scss'],
})
export class PersonalPage {
  @ViewChild(IonContent)
  public ionContent: IonContent;

  public isDebug: boolean = !environment.production;

  public countries: any = null;
  public countryChoice: number = null;
  public programs: any = null;

  public conversation = [];

  myTurn = false;

  constructor(
    public programsService: ProgramsServiceApiService,
  ) { }

  public getCountries(): any {
    this.programsService.getCountries().subscribe(response => {
      this.countries = response;
    });
  }

  public getAllPrograms(): any {
    this.programsService.getAllPrograms().subscribe(response => {
      this.programs = response;
    });
  }

  public getProgramsByCountryId(countryId: number): any {
    this.programsService.getProgramsByCountryId(countryId).subscribe(response => {
      this.programs = response;
    });
  }

  getActor(isMe: boolean = false) {
    return isMe ? 'self' : 'system';
  }

  getRandomHello() {
    const hellos = [
      'hello',
      'hallo',
      'hey',
      'hi',
      'ola',
      'allo',
    ];

    return hellos[Math.floor(Math.random() * hellos.length)];
  }

  addTurn(theActor: string, theContent: any) {
    this.conversation.push({
      actor: theActor,
      content: theContent,
    });
  }

  public sayHello() {
    console.log('Hello!');
    this.addTurn(this.getActor(this.myTurn), this.getRandomHello());
    this.myTurn = !this.myTurn;

    // Wait for the elements to be added to the DOM before scrolling down
    setTimeout(() => {
      this.ionContent.scrollToBottom();
    }, 100);
  }
}