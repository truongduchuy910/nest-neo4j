import { Inject } from "@nestjs/common";
import { getDriverToken, getNodeToken, getOGMToken } from "./neo4j.utils";

/**
 * get node
 * @InjectNode(TodoEntity.nodeName) node: Node
 */
export const InjectNode = (model: string, connectionName?: string) =>
  Inject(getNodeToken(model, connectionName));

/**
 * get driver
 * @InjectDriver() private readonly driver: Driver
 */
export const InjectDriver = (name?: string) => Inject(getDriverToken(name));

export const InjectOGM = (name?: string) => Inject(getOGMToken(name));
