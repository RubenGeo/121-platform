import { StatusMessageDto } from './../../shared/dto/status-message.dto';
import { StatusEnum } from './../../shared/enum/status.enum';
import { PaMetrics } from './dto/pa-metrics.dto';
import { ProgramMetrics } from './dto/program-metrics.dto';
import { FundingOverview } from './../../funding/dto/funding-overview.dto';
import { FundingService } from './../../funding/funding.service';
import { TransactionEntity } from './transactions.entity';
import { VoiceService } from './../../notifications/voice/voice.service';
import { SchemaService } from './../../sovrin/schema/schema.service';
import { CredentialService } from './../../sovrin/credential/credential.service';
import { ProofService } from './../../sovrin/proof/proof.service';
import { ConnectionEntity } from './../../sovrin/create-connection/connection.entity';
import { CustomCriterium } from './custom-criterium.entity';
import {
  Injectable,
  HttpException,
  Inject,
  forwardRef,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { ProgramEntity } from './program.entity';
import { ProgramPhase } from '../../models/program-phase.model';
import { PaStatus } from '../../models/pa-status.model';
import { UserEntity } from '../../user/user.entity';
import { CreateProgramDto } from './dto';
import { ProgramRO, ProgramsRO, SimpleProgramRO } from './program.interface';
import { InclusionStatus } from './dto/inclusion-status.dto';
import { InclusionRequestStatus } from './dto/inclusion-request-status.dto';
import { ProtectionServiceProviderEntity } from './protection-service-provider.entity';
import { SmsService } from '../../notifications/sms/sms.service';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { ExportType } from './dto/export-details';
import { NotificationType } from './dto/notification';
import { ActionEntity, ActionType } from '../../actions/action.entity';
import { FspService } from '../fsp/fsp.service';
import { FspPaymentResultDto } from '../fsp/dto/fsp-payment-results.dto';

@Injectable()
export class ProgramService {
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(CustomCriterium)
  public customCriteriumRepository: Repository<CustomCriterium>;
  @InjectRepository(FinancialServiceProviderEntity)
  public financialServiceProviderRepository: Repository<
    FinancialServiceProviderEntity
  >;
  @InjectRepository(ProtectionServiceProviderEntity)
  public protectionServiceProviderRepository: Repository<
    ProtectionServiceProviderEntity
  >;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ActionEntity)
  public actionRepository: Repository<ActionEntity>;

  public constructor(
    @Inject(forwardRef(() => CredentialService))
    private readonly credentialService: CredentialService,
    private readonly voiceService: VoiceService,
    @Inject(forwardRef(() => SmsService))
    private readonly smsService: SmsService,
    private readonly schemaService: SchemaService,
    @Inject(forwardRef(() => ProofService))
    private readonly proofService: ProofService,
    private readonly fundingService: FundingService,
    private readonly fspService: FspService,
  ) {}

  public async findOne(where): Promise<ProgramEntity> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium')
      .addOrderBy('customCriterium.id', 'ASC')
      .leftJoinAndSelect('program.aidworkers', 'aidworker')
      .leftJoinAndSelect(
        'program.financialServiceProviders',
        'financialServiceProvider',
      )
      .leftJoinAndSelect(
        'program.protectionServiceProviders',
        'protectionServiceProvider',
      );

    qb.whereInIds([where]);
    const program = qb.getOne();
    return program;
  }

  public async findAll(query): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium')
      .addOrderBy('customCriterium.id', 'ASC');

    qb.where('1 = 1');

    if ('location' in query) {
      qb.andWhere('lower(program.location) LIKE :location', {
        location: `%${query.location.toLowerCase()}%`,
      });
    }

    if ('countryId' in query) {
      qb.andWhere('program.countryId = :countryId', {
        countryId: query.countryId,
      });
    }

    qb.orderBy('program.created', 'DESC');

    const programsCount = await qb.getCount();
    const programs = await qb.getMany();

    return { programs, programsCount };
  }

  public async findByCountry(query): Promise<ProgramsRO> {
    const qb = await getRepository(ProgramEntity)
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.customCriteria', 'customCriterium')
      .addOrderBy('customCriterium.id', 'ASC')
      .where('"countryId" = :countryId', { countryId: query });

    let programs = await qb.getMany();
    programs = programs.filter(program => program.published);

    const programsCount = programs.length;
    return { programs, programsCount };
  }

  public async create(
    userId: number,
    programData: CreateProgramDto,
  ): Promise<ProgramEntity> {
    let program = new ProgramEntity();
    program.location = programData.location;
    program.ngo = programData.ngo;
    program.contactDetails = programData.contactDetails;
    program.title = programData.title;
    program.startDate = programData.startDate;
    program.endDate = programData.endDate;
    program.currency = programData.currency;
    program.distributionFrequency = programData.distributionFrequency;
    program.distributionDuration = programData.distributionDuration;
    program.fixedTransferValue = programData.fixedTransferValue;
    program.inclusionCalculationType = programData.inclusionCalculationType;
    program.minimumScore = programData.minimumScore;
    program.highestScoresX = programData.highestScoresX;
    program.meetingDocuments = programData.meetingDocuments;
    program.notifications = programData.notifications;
    program.phoneNumberPlaceholder = programData.phoneNumberPlaceholder;
    program.description = programData.description;
    program.descLocation = programData.descLocation;
    program.descHumanitarianObjective = programData.descHumanitarianObjective;
    program.descCashType = programData.descCashType;
    program.countryId = programData.countryId;
    program.validation = programData.validation;
    program.customCriteria = [];
    program.financialServiceProviders = [];
    program.protectionServiceProviders = [];

    const author = await this.userRepository.findOne(userId);
    program.author = author;

    for (let customCriterium of programData.customCriteria) {
      let customReturn = await this.customCriteriumRepository.save(
        customCriterium,
      );
      program.customCriteria.push(customReturn);
    }
    for (let item of programData.financialServiceProviders) {
      let fsp = await this.financialServiceProviderRepository.findOne({
        relations: ['program'],
        where: { id: item.id },
      });
      if (!fsp) {
        const errors = `No fsp found with id ${item.id}`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }
      fsp.program.push(program);
      await this.financialServiceProviderRepository.save(fsp);
    }
    for (let item of programData.protectionServiceProviders) {
      let psp = await this.protectionServiceProviderRepository.findOne({
        relations: ['program'],
        where: { id: item.id },
      });
      if (!psp) {
        const errors = `No psp found with id ${item.id}`;
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }
      psp.program.push(program);
      await this.protectionServiceProviderRepository.save(psp);
    }

    const newProgram = await this.programRepository.save(program);
    return newProgram;
  }

  public async update(id: number, programData: any): Promise<ProgramRO> {
    let toUpdate = await this.programRepository.findOne({ id: id });
    let updated = Object.assign(toUpdate, programData);
    const program = await this.programRepository.save(updated);
    return { program };
  }

  public async delete(programId: number): Promise<DeleteResult> {
    return await this.programRepository.delete(programId);
  }

  public async changeState(
    programId: number,
    newState: string,
  ): Promise<SimpleProgramRO> {
    await this.changeProgramValue(programId, {
      state: newState,
    });
    const changedProgram = await this.findOne(programId);
    if (newState === ProgramPhase.registrationValidation) {
      await this.publish(programId);
    }
    return this.buildProgramRO(changedProgram);
  }

  public async publish(programId: number): Promise<SimpleProgramRO> {
    const selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == true) {
      const errors = { Program: ' already published' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    const result = await this.schemaService.create(selectedProgram);

    const credentialOffer = await this.credentialService.createOffer(
      result.credDefId,
    );

    const proofRequest = await this.proofService.createProofRequest(
      selectedProgram,
      result.credDefId,
    );

    await this.changeProgramValue(programId, {
      credOffer: credentialOffer,
    });
    await this.changeProgramValue(programId, { schemaId: result.schemaId });
    await this.changeProgramValue(programId, { credDefId: result.credDefId });
    await this.changeProgramValue(programId, {
      proofRequest: proofRequest,
    });
    await this.changeProgramValue(programId, { published: true });

    const changedProgram = await this.findOne(programId);
    return await this.buildProgramRO(changedProgram);
  }

  public async unpublish(programId: number): Promise<SimpleProgramRO> {
    let selectedProgram = await this.findOne(programId);
    if (selectedProgram.published == false) {
      const errors = { Program: ' already unpublished' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    await this.changeProgramValue(programId, { published: false });
    return await this.buildProgramRO(selectedProgram);
  }

  private async changeProgramValue(
    programId: number,
    change: object,
  ): Promise<void> {
    await getRepository(ProgramEntity)
      .createQueryBuilder()
      .update(ProgramEntity)
      .set(change)
      .where('id = :id', { id: programId })
      .execute();
  }

  private buildProgramRO(program: ProgramEntity): SimpleProgramRO {
    const simpleProgramRO = {
      id: program.id,
      title: program.title,
      state: program.state,
    };

    return simpleProgramRO;
  }

  public async includeMe(
    programId: number,
    did: string,
    encryptedProof: string,
  ): Promise<InclusionRequestStatus> {
    `
    Verifier/HO gets schema_id/cred_def_id from ledger and validates proof.
    Inclusion algorithm is run. (Allocation algorithm as well?)
    Inclusion result is added to db (connectionRepository)?
    When done (time-loop): run getInclusionStatus from PA.
    `;
    const proof = encryptedProof; // this should actually be decrypted in a future scenario

    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    if (connection.programsEnrolled.includes(+programId)) {
      const errors = 'Already enrolled for program';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    let program = await this.programRepository.findOne(programId, {
      relations: ['customCriteria'],
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    await this.proofService.validateProof(program.proofRequest, proof, did);

    const questionAnswerList = this.createQuestionAnswerListProof(
      program,
      proof,
    );
    connection.customData = this.getPersitentDataFromProof(
      connection.customData,
      questionAnswerList,
      program.customCriteria,
    );

    // Calculates the score based on the ctritria of a program and the aggregrated score list
    const totalScore = this.calculateScoreAllCriteria(
      program.customCriteria,
      questionAnswerList,
    );
    connection.inclusionScore = totalScore;

    // Add to enrolled-array, if not yet present
    const index = connection.programsEnrolled.indexOf(
      parseInt(String(programId), 10),
    );
    if (index <= -1) {
      connection.programsEnrolled.push(programId);
    }

    // Depending on method: immediately determine inclusionStatus (minimumScore) or later (highestScoresX)
    let inclusionRequestStatus: InclusionRequestStatus;
    if (program.inclusionCalculationType === 'minimumScore') {
      // Checks if PA is elegible based on the minimum score of the program
      let inclusionResult = totalScore >= program.minimumScore;

      if (inclusionResult) {
        connection.programsIncluded.push(programId);
      }
      inclusionRequestStatus = { status: 'done' };
    } else if (program.inclusionCalculationType === 'highestScoresX') {
      // In this case an inclusion-status can only be given later.
      inclusionRequestStatus = { status: 'pending' };
    }

    await this.connectionRepository.save(connection);

    return inclusionRequestStatus;
  }

  private async notifyInclusionStatus(
    connection,
    programId,
    inclusionResult,
  ): Promise<void> {
    this.smsService.notifyBySms(
      connection.phoneNumber,
      connection.preferredLanguage,
      inclusionResult ? PaStatus.included : PaStatus.rejected,
      programId,
    );
    this.voiceService.notifyByVoice(
      connection.phoneNumber,
      connection.preferredLanguage,
      inclusionResult ? PaStatus.included : PaStatus.rejected,
      programId,
    );
  }

  public async getInclusionStatus(
    programId: number,
    did: string,
  ): Promise<InclusionStatus> {
    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const notificationDone =
      (
        await this.actionRepository.find({
          where: {
            program: { id: programId },
            actionType: ActionType.notifyIncluded,
          },
        })
      ).length > 0;

    let inclusionStatus: InclusionStatus;
    if (connection.programsIncluded.includes(+programId) && notificationDone) {
      inclusionStatus = { status: PaStatus.included };
    } else if (connection.programsRejected.includes(+programId)) {
      inclusionStatus = { status: PaStatus.rejected };
    } else {
      inclusionStatus = { status: 'unavailable' };
    }
    return inclusionStatus;
  }

  public async selectForValidation(
    programId: number,
    dids: object,
  ): Promise<void> {
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const selectedForValidationDate = new Date();

    for (let did of JSON.parse(dids['dids'])) {
      let connection = await this.connectionRepository.findOne({
        where: { did: did.did },
      });
      if (!connection) {
        continue;
      }

      connection.selectedForValidationDate = selectedForValidationDate;
      await this.connectionRepository.save(connection);
    }
  }

  public async include(programId: number, dids: object): Promise<void> {
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let did of JSON.parse(dids['dids'])) {
      let connection = await this.connectionRepository.findOne({
        where: { did: did.did },
      });
      if (!connection) {
        continue;
      }

      // Add to inclusion-array, if not yet present
      const indexIn = connection.programsIncluded.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexIn <= -1) {
        connection.programsIncluded.push(programId);
      }
      // Remove from rejection-array, if present
      const indexEx = connection.programsRejected.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexEx > -1) {
        connection.programsRejected.splice(indexEx, 1);
      }
      connection.inclusionDate = new Date();
      await this.connectionRepository.save(connection);
    }
  }

  public async reject(programId: number, dids: object): Promise<void> {
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let did of JSON.parse(dids['dids'])) {
      let connection = await this.connectionRepository.findOne({
        where: { did: did.did },
      });
      if (!connection) {
        continue;
      }

      // Add to rejection-array, if not yet present
      const indexEx = connection.programsRejected.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexEx <= -1) {
        connection.programsRejected.push(programId);
        this.notifyInclusionStatus(connection, programId, false);
      }
      // Remove from inclusion-array, if present
      const indexIn = connection.programsIncluded.indexOf(
        parseInt(String(programId), 10),
      );
      if (indexIn > -1) {
        connection.programsIncluded.splice(indexIn, 1);
      }
      connection.rejectionDate = new Date();
      await this.connectionRepository.save(connection);
    }
  }

  public async notify(
    programId: number,
    notificationType: NotificationType,
  ): Promise<void> {
    let program = await this.programRepository.findOne(+programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    if (notificationType === NotificationType.include) {
      const includedDids = (
        await this.getConnectionsWithStatus(programId, PaStatus.included)
      ).map(i => i.did);

      for (let did of includedDids) {
        let connection = await this.connectionRepository.findOne({
          where: { did: did },
        });
        this.notifyInclusionStatus(connection, programId, true);
      }
    }
  }

  public async calculateInclusionPrefilledAnswers(
    did: string,
    programId: number,
  ): Promise<void> {
    const scoreList = await this.createQuestionAnswerListPrefilled(
      did,
      programId,
    );

    let program = await this.programRepository.findOne(programId, {
      relations: ['customCriteria'],
    });
    const score = this.calculateScoreAllCriteria(
      program.customCriteria,
      scoreList,
    );
    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    connection.temporaryInclusionScore = score;
    if (!program.validation) {
      connection.inclusionScore = score;
    }
    await this.connectionRepository.save(connection);
  }

  private async createQuestionAnswerListPrefilled(
    did: string,
    programId: number,
  ): Promise<object> {
    const prefilledAnswers = await this.credentialService.getPrefilledAnswers(
      did,
      programId,
    );
    const scoreList = {};
    for (let prefilledAnswer of prefilledAnswers) {
      let attrValue = prefilledAnswer.answer;
      let newKeyName = prefilledAnswer.attribute;
      scoreList[newKeyName] = attrValue;
    }
    return scoreList;
  }

  private createQuestionAnswerListProof(
    program: ProgramEntity,
    proof: string,
  ): object {
    // Convert the proof in an array, for some unknown reason it has to be JSON parse multiple times
    const proofJson = JSON.parse(proof);
    const proofObject = JSON.parse(proofJson['proof']);
    const revealedAttrProof = proofObject['requested_proof']['revealed_attrs'];

    // Uses the proof request to relate the revealed_attr from the proof to the corresponding ctriteria'
    const proofRequest = JSON.parse(program.proofRequest);
    const attrRequest = proofRequest['requested_attributes'];

    const inclusionCriteriaAnswers = {};
    for (let attrKey in revealedAttrProof) {
      let attrValue = revealedAttrProof[attrKey];
      let newKeyName = attrRequest[attrKey]['name'];
      inclusionCriteriaAnswers[newKeyName] = attrValue['raw'];
    }
    return inclusionCriteriaAnswers;
  }

  private calculateScoreAllCriteria(
    programCriteria: CustomCriterium[],
    scoreList: object,
  ): number {
    let totalScore = 0;
    for (let criterium of programCriteria) {
      let criteriumName = criterium.criterium;
      if (scoreList[criteriumName]) {
        let answerPA = scoreList[criteriumName];
        switch (criterium.answerType) {
          case 'dropdown': {
            totalScore =
              totalScore + this.getScoreForDropDown(criterium, answerPA);
          }
          case 'numeric':
            totalScore =
              totalScore + this.getScoreForNumeric(criterium, answerPA);
        }
      }
    }
    return totalScore;
  }

  private getScoreForDropDown(
    criterium: CustomCriterium,
    answerPA: object,
  ): number {
    // If questions has no scoring system return 0;
    if (Object.keys(criterium.scoring).length === 0) {
      return 0;
    }
    let score = 0;
    const options = JSON.parse(JSON.stringify(criterium.options));
    for (let value of options) {
      if (value.option == answerPA) {
        score = criterium.scoring[value.option];
      }
    }
    return score;
  }

  private getScoreForNumeric(
    criterium: CustomCriterium,
    answerPA: number,
  ): number {
    let score = 0;
    if (criterium.scoring['multiplier']) {
      if (isNaN(answerPA)) {
        answerPA = 0;
      }
      score = criterium.scoring['multiplier'] * answerPA;
    }
    return score;
  }

  private getPersitentDataFromProof(
    customData: Record<string, any>,
    questionAnswerList: Record<string, any>,
    programCriteria: CustomCriterium[],
  ): any {
    for (let criterium of programCriteria) {
      if (criterium.persistence) {
        let criteriumName = criterium.criterium;
        customData[criteriumName] = questionAnswerList[criteriumName];
      }
    }
    return customData;
  }

  private async getIncludedConnections(
    programId: number,
  ): Promise<ConnectionEntity[]> {
    const connections = await this.connectionRepository.find({
      relations: ['fsp'],
    });
    const includedConnections = [];
    for (let connection of connections) {
      if (connection.programsIncluded.includes(+programId)) {
        includedConnections.push(connection);
      }
    }
    return includedConnections;
  }

  public async getTotalIncluded(programId): Promise<number> {
    const includedConnections = await this.getIncludedConnections(programId);
    return includedConnections.length;
  }

  public async payout(
    programId: number,
    installment: number,
    amount: number,
  ): Promise<StatusMessageDto> {
    let program = await this.programRepository.findOne(programId, {
      relations: ['financialServiceProviders'],
    });
    if (!program || program.state === 'design') {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const includedConnections = await this.getIncludedConnections(programId);
    if (includedConnections.length < 1) {
      const errors = 'There are no included PA for this program';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const fundingOverview = await this.fundingService.getProgramFunds(
      programId,
    );
    const fundsNeeded = amount * includedConnections.length;
    if (fundsNeeded > fundingOverview.totalAvailable) {
      const errors = 'Insufficient funds';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    let nrConnectionsFsp = 0,
      nrSuccessfull = 0;
    const failedFsps = [];
    let result: FspPaymentResultDto;
    for (let fsp of program.financialServiceProviders) {
      result = await this.fspService.createSendPaymentListFsp(
        fsp,
        includedConnections,
        amount,
        program,
        installment,
      );
      nrConnectionsFsp += result.nrConnectionsFsp;
      nrSuccessfull += result.nrSuccessfull;

      if (result.paymentResult.status === StatusEnum.error) {
        failedFsps.push(fsp.fsp);
      }
    }
    const nrFailed = nrConnectionsFsp - nrSuccessfull;

    if (nrConnectionsFsp === 0) {
      const errors =
        'No included connections with known FSP available. Payment aborted.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    return {
      status: StatusEnum.success,
      nrSuccessfull,
      nrFailed,
    };
  }

  private getPaStatus(connection, programId: number): PaStatus {
    let paStatus: PaStatus;
    if (connection.programsIncluded.includes(+programId)) {
      paStatus = PaStatus.included;
    } else if (connection.programsRejected.includes(+programId)) {
      paStatus = PaStatus.rejected;
    } else if (connection.validationDate) {
      paStatus = PaStatus.validated;
    } else if (connection.selectedForValidationDate) {
      paStatus = PaStatus.selectedForValidation;
    } else if (connection.appliedDate) {
      paStatus = PaStatus.registered;
    } else if (connection.created) {
      paStatus = PaStatus.created;
    }
    return paStatus;
  }

  public async getConnections(
    programId: number,
    privacy: boolean,
  ): Promise<any[]> {
    const selectedConnections = await this.getAllConnections(programId);

    const connectionsResponse = [];
    for (let connection of selectedConnections) {
      const connectionResponse = {};
      connectionResponse['did'] = connection.did;
      connectionResponse['score'] = connection.inclusionScore;
      connectionResponse['tempScore'] = connection.temporaryInclusionScore;
      connectionResponse['created'] = connection.created;
      connectionResponse['updated'] = connection.updated;
      connectionResponse['appliedDate'] = connection.appliedDate;
      connectionResponse['selectedForValidationDate'] =
        connection.selectedForValidationDate;
      connectionResponse['validationDate'] = connection.validationDate;
      connectionResponse['inclusionDate'] = connection.inclusionDate;
      connectionResponse['rejectionDate'] = connection.rejectionDate;
      if (privacy) {
        connectionResponse['name'] = connection.customData['name'];
        connectionResponse['dob'] = connection.customData['dob'];
        connectionResponse['phoneNumber'] =
          connection.phoneNumber || connection.customData['phoneNumber'];
        connectionResponse['location'] = connection.customData['location'];
        connectionResponse['firstName'] = connection.customData['firstName'];
        connectionResponse['secondName'] = connection.customData['secondName'];
        connectionResponse['thirdName'] = connection.customData['thirdName'];
        connectionResponse['age'] = connection.customData['age'];
      }
      connectionResponse['status'] = this.getPaStatus(connection, +programId);
      connectionsResponse.push(connectionResponse);
    }
    return connectionsResponse;
  }

  private async getAllConnections(programId): Promise<ConnectionEntity[]> {
    const connections = await this.connectionRepository.find({
      order: { inclusionScore: 'DESC' },
    });
    const enrolledConnections = [];
    for (let connection of connections)
      if (
        connection.programsApplied.includes(+programId) || // Get connections applied to your program ..
        connection.programsApplied.length === 0 // .. and connections applied to no program (so excluding connections applied to other program)
      ) {
        enrolledConnections.push(connection);
      }
    return enrolledConnections;
  }

  public async getInstallments(programId: number): Promise<any> {
    const installments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.amount, transaction.installment')
      .addSelect('MIN(transaction.created)', 'installmentDate')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere("transaction.status = 'success'")
      .groupBy('transaction.amount, transaction.installment')
      .getRawMany();
    return installments;
  }

  public async getTransactions(programId: number): Promise<any> {
    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.created AS installmentDate',
        'installment',
        'did',
        'status',
        'transaction.errorMessage as error',
      ])
      .leftJoin('transaction.connection', 'c')
      .where('transaction.program.id = :programId', { programId: programId })
      .orderBy('transaction.created', 'DESC')
      .getRawMany();
    return transactions;
  }

  public async getFunds(programId: number): Promise<FundingOverview> {
    // TO DO: call real API here, for now static data.
    const program = await this.programRepository.findOne({
      where: { id: programId },
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const fundsDisberse = await this.fundingService.getProgramFunds(programId);
    return fundsDisberse;
  }

  public async getPaymentDetails(
    programId: number,
    installmentId: number,
  ): Promise<any> {
    let rawPaymentDetails = await this.getPaymentDetailsInstallment(
      programId,
      installmentId,
    );

    let installmentTime = 'completed';
    if (rawPaymentDetails.length === 0) {
      rawPaymentDetails = await this.getPaymentDetailsFuture(programId);
      installmentTime = 'future';
    }
    const paymentDetails = [];
    rawPaymentDetails.forEach(rawTransaction => {
      let transaction = {
        ...rawTransaction,
        ...rawTransaction.connection_customData,
      };
      delete transaction['connection_customData'];
      paymentDetails.push(transaction);
    });

    const response = {
      fileName: `payment-details-${installmentTime}-installment-${programId}.csv`,
      data: this.jsonToCsv(paymentDetails),
    };

    return response;
  }

  public getExportList(
    programId: number,
    type: ExportType,
    installment: number | null = null,
  ): Promise<any> {
    switch (type) {
      case ExportType.included: {
        return this.getInclusionList(programId);
      }
      case ExportType.selectedForValidation: {
        return this.getSelectedForValidationList(programId);
      }
      case ExportType.payment: {
        return this.getPaymentDetails(programId, installment);
      }
    }
  }

  private async getConnectionsWithStatus(
    programId: number,
    status: PaStatus,
  ): Promise<any[]> {
    return (await this.getConnections(programId, true)).filter(
      i => i.status === status,
    );
  }

  private async getInclusionList(programId: number): Promise<any> {
    const includedConnections = await this.getConnectionsWithStatus(
      programId,
      PaStatus.included,
    );

    const inclusionDetails = [];
    includedConnections.forEach(rawConnection => {
      let row = {
        name: rawConnection.name,
        firstName: rawConnection.firstName,
        secondName: rawConnection.secondName,
        thirdName: rawConnection.thirdName,
        dateOfBirth: rawConnection.dob,
        location: rawConnection.location,
        age: rawConnection.age,
        status: rawConnection.status,
        createdDate: rawConnection.created,
        registrationDate: rawConnection.appliedDate,
        selectedForValidationDate: rawConnection.selectedForValidation,
        validationDate: rawConnection.validationDate,
        inclusionDate: rawConnection.inclusionDate,
      };
      inclusionDetails.push(row);
    });
    const filteredColumnDetails = this.filterUnusedColumn(inclusionDetails);
    const response = {
      fileName: `inclusion-list-program-${programId}.csv`,
      data: this.jsonToCsv(filteredColumnDetails),
    };

    return response;
  }

  private async getSelectedForValidationList(programId: number): Promise<any> {
    const selectedConnections = await this.getConnectionsWithStatus(
      programId,
      PaStatus.selectedForValidation,
    );
    const columnDetails = [];
    for (const rawConnection of selectedConnections) {
      let row = {
        name: rawConnection.name,
        firstName: rawConnection.firstName,
        secondName: rawConnection.secondName,
        thirdName: rawConnection.thirdName,
        dateOfBirth: rawConnection.dob,
        location: rawConnection.location,
        age: rawConnection.age,
        status: rawConnection.status,
        createdDate: rawConnection.created,
        registrationDate: rawConnection.appliedDate,
        selectedForValidationDate: rawConnection.selectedForValidationDate,
        phoneNumber: rawConnection.phoneNumber,
      };
      columnDetails.push(row);
    }
    const filteredColumnDetails = this.filterUnusedColumn(columnDetails);
    const response = {
      fileName: `selected-for-validation-list-program-${programId}.csv`,
      data: this.jsonToCsv(filteredColumnDetails),
    };

    return response;
  }

  public filterUnusedColumn(columnDetails): object[] {
    const emptyColumns = [];
    for (let row of columnDetails) {
      for (let key in row) {
        if (row[key]) {
          emptyColumns.push(key);
        }
      }
    }
    const filteredColumns = [];
    for (let row of columnDetails) {
      for (let key in row) {
        if (!emptyColumns.includes(key)) {
          delete row[key];
        }
      }
      filteredColumns.push(row);
    }
    return filteredColumns;
  }

  public async getPaymentDetailsInstallment(
    programId: number,
    installmentId: number,
  ): Promise<any> {
    return await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.amount',
        'transaction.installment',
        'connection.phoneNumber',
        'connection.customData',
      ])
      .leftJoin('transaction.connection', 'connection')
      .where('transaction.program.id = :programId', { programId: programId })
      .andWhere('transaction.installment = :installmentId', {
        installmentId: installmentId,
      })
      .getRawMany();
  }

  public async getPaymentDetailsFuture(programId: number): Promise<any> {
    const connections = await this.connectionRepository
      .createQueryBuilder('connection')
      .select([
        'connection.phoneNumber',
        'connection.customData',
        'connection.programsIncluded',
      ])
      .getRawMany();
    const rawPaymentDetails = [];
    for (let connection of connections) {
      if (connection.connection_programsIncluded.includes(+programId)) {
        delete connection['connection_programsIncluded'];
        rawPaymentDetails.push(connection);
      }
    }
    return rawPaymentDetails;
  }

  public jsonToCsv(items: any): any {
    if (items.length === 0) {
      return '';
    }
    const replacer = (key, value): any => (value === null ? '' : value); // specify how you want to handle null values here
    const header = Object.keys(items[0]);
    let csv = items.map(row =>
      header
        .map(fieldName => JSON.stringify(row[fieldName], replacer))
        .join(','),
    );
    csv.unshift(header.join(','));
    csv = csv.join('\r\n');
    return csv;
  }

  public async getMetrics(programId): Promise<ProgramMetrics> {
    const metrics = new ProgramMetrics();
    metrics.funding = await this.getFunds(programId);
    metrics.pa = await this.getPaMetrics(programId);
    metrics.updated = new Date();
    return metrics;
  }

  private filteredLength(connections, filterStatus: PaStatus): number {
    const filteredConnections = connections.filter(
      connection => connection.status === filterStatus,
    );
    return filteredConnections.length;
  }

  public async getPaMetrics(programId): Promise<PaMetrics> {
    const metrics = new PaMetrics();
    const connections = await this.getConnections(programId, false);

    metrics.included = this.filteredLength(connections, PaStatus.included);
    metrics.excluded = this.filteredLength(connections, PaStatus.rejected);
    metrics.verified =
      this.filteredLength(connections, PaStatus.validated) +
      metrics.included +
      metrics.excluded;
    metrics.finishedEnlisting =
      this.filteredLength(connections, PaStatus.registered) + metrics.verified;
    metrics.startedEnlisting =
      this.filteredLength(connections, PaStatus.created) +
      metrics.finishedEnlisting;

    return metrics;
  }
}
