import neo4j from 'neo4j-driver';

export class Neo4jAdapter {
  driver?: any;

  constructor(uri: string, username: string, password: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      disableLosslessIntegers: true,
    }) as any;
  }

  async heathcheck() {
    return this.driver.verifyConnectivity().then((info: any) => {
      console.log(info);
    });
  }

  close() {
    return this.driver.close();
  }

  async session(queries: string[]) {
    const session = this.driver.session();
    const responses: any[] = [];
    try {
      for (const query of queries) {
        const response = await session.run(query);
        responses.push(response);
      }
    } catch {
    } finally {
      await session.close();
    }
    return responses;
  }

  async runOne(query: string) {
    const [response] = (await this.session([query])) || [];
    return response;
  }
}
