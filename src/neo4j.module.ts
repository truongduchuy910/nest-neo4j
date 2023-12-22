import { DynamicModule, Logger } from "@nestjs/common";
import { createNodeProvider } from "./neo4j.providers";
import { Neo4jCoreModule } from "./neo4j.core";
import { Neo4jModuleAsyncOptions } from "./interfaces";
import { print } from "graphql/language";

export class Neo4jModule {
  static logger = new Logger(Neo4jModule.name);

  /**
   * imports in app.module.ts
   */

  static forRootAsync(options: Neo4jModuleAsyncOptions): DynamicModule {
    return {
      module: Neo4jModule,
      imports: [
        Neo4jCoreModule.forRootAsync(options, Neo4jCoreModule.typeDefs),
      ],
    };
  }

  /**
   * imports in *.module.ts
   */

  static forFeature(
    nodes: { name: string; typeDefs: any }[] = [],
    connectionName?: string,
  ): DynamicModule {
    if (!nodes.length) throw new Error("Node is empty");

    const [node] = nodes;
    Neo4jModule.logger.log(`🪛 for feature ${node.name}`);
    const providers = createNodeProvider(connectionName, nodes);
    const typeDefs = print(node.typeDefs);
    Neo4jCoreModule.typeDefs.push(typeDefs);
    return {
      module: Neo4jModule,
      providers,
      exports: providers,
    };
  }
}
