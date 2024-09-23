import type { Model } from '@neo4j/graphql-ogm';
import { ASTNode } from 'graphql/language';

export type Node = Model;

export type DiscriminatorOptions = {
  name: string;
  value?: string;
};

export type NodeDefinition = {
  name: string;
  typeDefs: ASTNode;
};
