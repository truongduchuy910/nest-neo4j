import { Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { delay, retryWhen, scan } from 'rxjs/operators';
import {
  DEFAULT_DB_CONNECTION,
  DEFAULT_OGM,
  DEFAULT_TYPES,
} from '../neo4j.constants';

/**
 * Token for inject node
 */
export function getNodeToken(model: string, connectionName?: string) {
  if (connectionName === undefined) {
    return `Neo4j${model}Node`;
  }
  return `Neo4j$${getDriverToken(connectionName)}/${model}Node`;
}

/**
 * TYPEDEFS
 * Token for inject typeDefs
 */
export function getTypeDefsToken(name?: string) {
  return name && name !== DEFAULT_TYPES
    ? `Neo4j${name}TypeDefs`
    : DEFAULT_TYPES;
}

/**
 * DRIVER
 * Token for inject driver
 */
export function getDriverToken(name?: string) {
  return name && name !== DEFAULT_DB_CONNECTION
    ? `Neo4j${name}Driver`
    : DEFAULT_DB_CONNECTION;
}

/**
 * Token for inject OGM
 */
export function getOGMToken(name?: string) {
  return name && name !== DEFAULT_OGM ? `Neo4j${name}OGM` : DEFAULT_OGM;
}

export function handleRetry(
  retryAttempts = 9,
  retryDelay = 3000,
): <T>(source: Observable<T>) => Observable<T> {
  const logger = new Logger('MongooseModule');
  return <T>(source: Observable<T>) =>
    source.pipe(
      retryWhen((e) =>
        e.pipe(
          scan((errorCount, error) => {
            logger.error(
              `Unable to connect to the database. Retrying (${
                errorCount + 1
              })...`,
              '',
            );
            if (errorCount + 1 >= retryAttempts) {
              throw error;
            }
            return errorCount + 1;
          }, 0),
          delay(retryDelay),
        ),
      ),
    );
}
