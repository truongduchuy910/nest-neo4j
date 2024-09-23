import { ModuleMetadata } from '@nestjs/common';
import { NodeDefinition } from './model-definition.interface';

export interface AsyncModelFactory
  extends Pick<ModuleMetadata, 'imports'>,
    NodeDefinition {
  useFactory: (
    ...args: any[]
  ) => NodeDefinition['typeDefs'] | Promise<NodeDefinition['typeDefs']>;
  inject?: any[];
}
