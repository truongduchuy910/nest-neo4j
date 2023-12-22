## Import module

import packages

```mjs
import gql from "graphql-tag";
import { Neo4jModule } from "nest-ogm";
```

config for connection

```mjs
@Module({
  imports: [Neo4jModule.forRootAsync({
  useFactory: async () => {
    const uri = 'neo4j-uri';
    const username = 'neo4j-username';
    const password = 'neo4j-password';

    return {
      uri,
      username,
      password,
      typeDefs: [
        gql`
          " general enum example "
          enum Reaction {
            Like
            Love
            Haha
          }
        `,
      ],
      options: {
        features: {
        /**
         * https://neo4j.com/docs/graphql/current/type-definitions/directives/autogeneration/
         */
          populatedBy: {
            callbacks: {},
          },
        },
      },
    };
  }),
})
export class AppModule {}
```

## Using

In this example we use Node with label name `User`, then name using to Inject
User Node in `UserService` must same with name using in `Neo4jModule.forFeature`

### 1. Define Neo4j Node

> `user.node.ts`

```mjs
import gql from 'graphql-tag';
import { Injectable, Logger } from '@nestjs/common';
import { Node } from 'nest-ogm';

export const typeDefs = gql`
  type User {
    id: ID! @id
    username: String! @unique
  }
`;

/**
* Data access layer
* Will be extends by Service
*/
@Injectable()
export class UserNeo4j {
  logger = new Logger(UserNeo4j.name);
  private node: Node;

  constructor(node: Node) {
    this.node = node;
  }

  getNode() {
    return this.node;
  }

  async findOneById(id: string) {
    const nodes = await this.node.find({
      where: { id },
      options: { limit: 1 },
      selectionSet: fullSetFind,
    });
    const [user] = nodes;
    return user;
  }
}
```

## 2. Inject in Service

> `user.service.ts`

```mjs
import { Injectable, Logger } from '@nestjs/common';
import { Driver, InjectDriver, InjectNode, Node } from 'nest-ogm';

import { UserNeo4j } from './user.node';

@Injectable()
export class UserService extends UserNeo4j {
  readonly logger = new Logger(UserService.name);

  /**
    * You can using method findOneById of class UserNeo4j
    */
  constructor(
    @InjectNode('User') node: Node,
    @InjectDriver() private readonly driver: Driver,
  ) {
    super(node);
  }

  /**
    * Get driver for cypher
    */
  getDriver() {
    return this.driver;
  }
}
```

### 3. Import in module

```mjs
import { Neo4jModule } from "nest-ogm";
import { Module } from "@nestjs/common";

import { UserService } from "./user.service";
import { typeDefs } from "./user.node";

@Module({
  imports: [Neo4jModule.forFeature([{ name: "User", typeDefs }])],
  providers: [UserService],
  exports: [UserService, Neo4jModule],
})
export class UserModule {}
```
