import { Injectable } from '@angular/core';
import { ProgramPhase, Program } from '../models/program.model';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { PROGRAM_PHASE_ORDER } from '../program-phase-order';

export class Phase {
  id: number;
  name: ProgramPhase;
  label: string;
  btnText: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProgramPhaseService {
  private programId: number;

  private program: Program;
  public activePhaseName: string;
  public phases: Phase[];

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private router: Router,
  ) {}

  private async loadProgram(programId: number) {
    this.programId = programId;
    this.program = await this.programsService.getProgramById(programId);
    this.activePhaseName = this.program.state;
  }

  private createPhases() {
    return PROGRAM_PHASE_ORDER.map((phase) => ({
      id: phase.id,
      name: phase.name,
      label: this.translate.instant(
        'page.program.phases.' + phase.name + '.label',
      ),
      btnText: this.translate.instant(
        'page.program.phases.' + phase.name + '.btnText',
      ),
      active: phase.name === this.activePhaseName,
    }));
  }

  public async getPhases(programId: number): Promise<Phase[]> {
    if (!this.phases) {
      await this.updatePhases(programId);
    }
    return this.phases;
  }

  private async updatePhases(programId: number) {
    await this.loadProgram(programId);
    this.phases = this.createPhases();
  }

  public getActivePhase(): Phase {
    return this.phases.find((phase) => phase.active);
  }

  public getPhaseByName(name: ProgramPhase): Phase {
    return this.phases.find((phase) => phase.name === name);
  }

  public getNextPhase(): Phase | null {
    const activePhase = this.getActivePhase();
    const nextPhaseId = activePhase.id + 1;
    return this.phases.find((phase) => phase.id === nextPhaseId);
  }

  public async advancePhase(): Promise<void> {
    const nextPhase = this.getNextPhase();

    await this.programsService
      .advancePhase(this.programId, nextPhase.name)
      .then(
        async () => {
          await this.updatePhases(this.programId);
          const newActivePhase = this.getActivePhase();
          this.router.navigate([
            'program',
            this.programId,
            newActivePhase.name,
          ]);
        },
        (error) => {
          console.log(error);
        },
      );
  }
}
