import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Driver } from 'neo4j-driver';
import { Logger } from '@nestjs/common';

import { getDriverToken } from './common/neo4j.utils';
import {
  Neo4jModuleAsyncOptions,
  Neo4jModuleFactoryOptions,
  Neo4jOptionsFactory,
} from './interfaces/neo4j-options.interface';
import { NEO4J_CONNECTION_NAME, NEO4J_MODULE_OPTIONS } from './neo4j.constants';
import {
  createNeo4jDriver,
  createNeo4jTypeDefProvider,
  createOGMProvider,
} from './neo4j.providers';
import { OGM } from '@neo4j/graphql-ogm';

@Global()
@Module({})
export class Neo4jCoreModule implements OnApplicationShutdown {
  static logger = new Logger(Neo4jCoreModule.name);
  static typeDefs: string[] = [];
  static ogm: OGM;

  constructor(
    @Inject(NEO4J_CONNECTION_NAME) private readonly connectionName: string,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    Neo4jCoreModule.logger.log('🪛 on module init');
  }

  /**
   * for root async
   * prepare connection
   */
  static forRootAsync(
    options: Neo4jModuleAsyncOptions,
    typeDefs: string[],
  ): DynamicModule {
    Neo4jCoreModule.logger.log('🪛 For root async');
    const neo4jDriverName = getDriverToken(options.connectionName);

    const neo4jDriverProvider = {
      provide: NEO4J_CONNECTION_NAME,
      useValue: neo4jDriverName,
    };

    /**
     * PROVIDER
     * return connection by neo4jDriverName
     */
    const driverProvider = {
      provide: neo4jDriverName,
      useFactory: async (
        neo4jModuleOptions: Neo4jModuleFactoryOptions,
      ): Promise<Driver> => {
        const { uri, username, password } = neo4jModuleOptions;
        if (!uri || !username || !password) {
          throw new Error('Missing options');
        }

        const driver = await createNeo4jDriver(uri, username, password);
        return driver;
      },
      inject: [NEO4J_MODULE_OPTIONS],
    };

    /**
     * PROVIDER
     * return schema as string by typeDefsToken
     */
    const typeDefsProvider = createNeo4jTypeDefProvider(typeDefs);

    const ogmProvider = createOGMProvider(typeDefs, options.connectionName);

    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: Neo4jCoreModule,
      imports: options.imports,
      providers: asyncProviders.concat([
        typeDefsProvider,
        ogmProvider,
        driverProvider,
        neo4jDriverProvider,
      ]),
      exports: [
        ogmProvider,
        driverProvider,
        typeDefsProvider,
        neo4jDriverProvider,
      ],
    };
  }

  private static createAsyncProviders(
    options: Neo4jModuleAsyncOptions,
  ): Provider[] {
    Neo4jCoreModule.logger.log('🪛 Create async provider');
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<Neo4jOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: Neo4jModuleAsyncOptions,
  ): Provider {
    Neo4jCoreModule.logger.log('🪛 Create async options provider');
    if (options.useFactory) {
      return {
        provide: NEO4J_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    const inject = [
      (options.useClass || options.useExisting) as Type<Neo4jOptionsFactory>,
    ];
    return {
      provide: NEO4J_MODULE_OPTIONS,
      useFactory: async (optionsFactory: Neo4jOptionsFactory) =>
        await optionsFactory.createNeo4jOptions(),
      inject,
    };
  }

  async onApplicationShutdown() {
    const connection = this.moduleRef.get<any>(this.connectionName);
    connection && (await connection.close());
  }
}
