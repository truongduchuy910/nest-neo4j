import { OGM } from '@neo4j/graphql-ogm';
import neo4j, { Driver } from 'neo4j-driver';
import { Provider } from '@nestjs/common';
import {
  getDriverToken,
  getNodeToken,
  getOGMToken,
  getTypeDefsToken,
} from './common/neo4j.utils';
import { Neo4jModuleFactoryOptions, NodeDefinition } from './interfaces';
import { print } from 'graphql/language';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { NEO4J_MODULE_OPTIONS } from './neo4j.constants';

export function createNeo4jTypeDefProvider(typeDefs: string[]): Provider {
  return {
    provide: getTypeDefsToken(),
    useFactory: () => {
      const merged = mergeTypeDefs(typeDefs);
      return print(merged);
    },
    inject: [],
  };
}

export function createOGMProvider(typeDefs: string[], connectionName: string) {
  const neo4jOGMName = getOGMToken(connectionName);
  return {
    provide: neo4jOGMName,
    useFactory: async (
      driver: Driver,
      neo4jModuleOptions: Neo4jModuleFactoryOptions,
    ) => {
      const baseTypeDefs = neo4jModuleOptions?.typeDefs || [];
      const defs = baseTypeDefs
        .map((t) => (typeof t === 'string' ? t : print(t)))
        .concat(typeDefs)
        .join('\n\n');
      const ogm = await createNeo4jOGM(
        defs,
        driver,
        neo4jModuleOptions?.options,
      );
      return ogm;
    },
    inject: [getDriverToken(connectionName), NEO4J_MODULE_OPTIONS],
  };
}

export function createNodeProvider(
  connectionName?: string,
  options: NodeDefinition[] = [],
): Provider[] {
  return options.reduce((providers: Provider[], option) => {
    const nodeToken = getNodeToken(option.name, connectionName);
    return providers.concat({
      provide: nodeToken,
      useFactory: async (ogm: OGM) => {
        if (!ogm) throw Error(`Missing OGM in ${nodeToken}`);
        const Node = ogm.model(option.name);
        return Node;
      },
      inject: [getOGMToken(connectionName)],
    });
  }, [] as Provider[]);
}

/**
 * create neo4j connection
 */

export async function createNeo4jDriver(
  uri: string,
  username: string,
  password: string,
): Promise<Driver> {
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    disableLosslessIntegers: true,
  });
  return driver;
}

export async function createNeo4jOGM(
  typeDefs: string,
  driver: Driver,
  options?: any,
) {
  if (!driver) throw new Error('Missing driver');

  const config = Object.assign(options || {}, {
    typeDefs,
    driver,
  });
  const ogm = new OGM(config);
  try {
    await ogm.init();
  } catch (errors) {
    const error = errors
      ?.map((error: Error) => {
        return error.message;
      })
      ?.join('\n');
    throw new Error(`Cannot create Neo4j OGM ${error}`);
  }
  await ogm
    .assertIndexesAndConstraints({
      options: {
        create: true,
      },
    })
    .catch((e) => {
      console.log(e.message);
    });
  return ogm;
}
