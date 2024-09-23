import { ModuleMetadata, Type } from '@nestjs/common';

export interface Neo4jModuleOptions {
  uri: string;
  username: string;
  password: string;
  typeDefs: any[];
  options: any;
}

export interface Neo4jOptionsFactory {
  createNeo4jOptions(): Promise<Neo4jModuleOptions> | Neo4jModuleOptions;
}

export type Neo4jModuleFactoryOptions = Omit<
  Neo4jModuleOptions,
  'connectionName'
>;

export interface Neo4jModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  connectionName?: string;
  useExisting?: Type<Neo4jOptionsFactory>;
  useClass?: Type<Neo4jOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<Neo4jModuleFactoryOptions> | Neo4jModuleFactoryOptions;
  inject?: any[];
}
