![nestjs module neo4j ogm](https://raw.githubusercontent.com/truongduchuy910/nest-ogm/18e9928e54fc41ef0d41cfe416745d8311fda300/src/public/neo4j-mlem.png)

# Description

Neo4j OGM module for Nest.

# Installation

Using yarn

```
yarn add nest-ogm
```

Using npm

```
npm i nest-ogm
```

# Quick Start

## Import module

import packages

```ts
import gql from "graphql-tag";
import { Neo4jModule } from "nest-ogm";
```

config for connection

```ts
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

```ts
import gql from "graphql-tag";
import { Injectable, Logger } from "@nestjs/common";
import { Node } from "nest-ogm";

export const typeDefs = gql`
  type User {
    id: ID! @id
    username: String! @unique
  }
`;

/**
 * Data access layer (DAL)
 * Will be extends by Service
 * We suggest using DAL to call node method.
 * You can skip if not necessary
 */
@Injectable()
export class UserNeo4j {
  readonly logger = new Logger(UserNeo4j.name);
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
    });
    const [user] = nodes;
    return user;
  }
}
```

## 2. Inject in Service

> `user.service.ts`

```ts
import { Injectable, Logger } from "@nestjs/common";
import { Driver, InjectDriver, InjectNode, Node } from "nest-ogm";

import { UserNeo4j } from "./user.node";

@Injectable()
export class UserService extends UserNeo4j {
  readonly logger = new Logger(UserService.name);

  /**
   * You can using method findOneById of class UserNeo4j
   */
  constructor(
    /* this inject dependent on Neo4jModule.forFeature */
    @InjectNode("User") node: Node,
    /* this inject dependent on Neo4jModule.forRootAsync */
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

```ts
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

# Support
