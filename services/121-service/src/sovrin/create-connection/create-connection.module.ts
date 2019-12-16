import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateConnectionService } from './create-connection.service';
import { CreateConnectionController } from './create-connection.controller';
import { ConnectionEntity } from './connection.entity';
import { AuthMiddlewareAdmin } from '../../user/auth.middlewareAdmin';
import { UserModule } from '../../user/user.module';
import { SovrinSetupModule } from '../setup/setup.module';
import { CredentialAttributesEntity } from '../credential/credential-attributes.entity';
import { CredentialRequestEntity } from '../credential/credential-request.entity';
import { CredentialEntity } from '../credential/credential.entity';
import { AppointmentEntity } from '../../schedule/appointment/appointment.entity';
import { FinancialServiceProviderEntity } from '../../programs/program/financial-service-provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentEntity,
      ConnectionEntity,
      CredentialAttributesEntity,
      CredentialRequestEntity,
      CredentialEntity,
      FinancialServiceProviderEntity
    ]),
    UserModule,
    SovrinSetupModule,
  ],
  providers: [CreateConnectionService],
  controllers: [CreateConnectionController],
})
export class CreateConnectionModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddlewareAdmin)
      .forRoutes({ path: 'create-connection/all', method: RequestMethod.POST });
  }
}
