import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';

import { SeedHelper } from './seed-helper';
import { SeedPublish } from './seed-publish';
import { SeedInit } from './seed-init';

import { CountryEntity } from '../programs/country/country.entity';

import fspBank from '../../examples/fsp-bravos.json';
import fspMobileMoney from '../../examples/fsp-pmesa.json';
import fspIntersolve from '../../examples/fsp-intersolve.json';

import programDemo from '../../examples/program-demo.json';
import { USERCONFIG } from '../secrets';
import { UserRole } from '../user-role.enum';

@Injectable()
export class SeedDemoProgram implements InterfaceScript {
  public constructor(private connection: Connection) {}

  private readonly seedHelper = new SeedHelper(this.connection);
  private readonly seedPublish = new SeedPublish();

  public async run(): Promise<void> {
    const seedInit = await new SeedInit(this.connection);
    await seedInit.run();

    // ***** CREATE USERS *****
    await this.seedHelper.addUser({
      role: UserRole.ProjectOfficer,
      email: USERCONFIG.emailProjectOfficer,
      countryId: USERCONFIG.countryId,
      password: USERCONFIG.passwordProjectOfficer,
    });

    await this.seedHelper.addUser({
      role: UserRole.ProgramManager,
      email: USERCONFIG.emailProgramManager,
      countryId: USERCONFIG.countryId,
      password: USERCONFIG.passwordProgramManager,
    });

    // ***** CREATE COUNTRIES *****
    const countryRepository = this.connection.getRepository(CountryEntity);
    await countryRepository.save([{ country: 'Westeros' }]);

    // ***** CREATE FINANCIAL SERVICE PROVIDERS *****
    await this.seedHelper.addFsp(fspIntersolve);
    await this.seedHelper.addFsp(fspBank);
    await this.seedHelper.addFsp(fspMobileMoney);

    // ***** CREATE PROGRAM *****
    const examplePrograms = [programDemo];
    await this.seedHelper.addPrograms(examplePrograms, 1);
  }
}

export default SeedDemoProgram;