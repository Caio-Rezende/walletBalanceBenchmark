import { BlockchainsEnum } from "../enums/blockchains";

type BenchmarkTime = {
  //blockchainName
  [key in BlockchainsEnum]?: number[];
};
type BenchmarkToken = {
  //blockchainName
  [key in BlockchainsEnum]?: string[];
};

type BenchmarkAttributes = {
  timeExec: BenchmarkTime;
  tokens: BenchmarkToken;
};

type BenchmarkTimeStatistics =
  | "totalTime"
  | "count"
  | "avgTime"
  | "maxTime"
  | "minTime"
  | `avgTimeFor${keyof typeof BlockchainsEnum}`;
type BenchmarkTokenStatistics =
  `missingTokensFor${keyof typeof BlockchainsEnum}`;

type BenchmarkTimeStatisticsResult = {
  [key in BenchmarkTimeStatistics]?: number;
};
type BenchmarkTokenStatisticsResult = {
  [key in BenchmarkTokenStatistics]?: string;
};

type resultAttributes =
  | "provider"
  | BenchmarkTimeStatistics
  | BenchmarkTokenStatistics;

type BenchmarkResultAttributes = {
  [key in resultAttributes]?: string | number;
};

export class Benchmark {
  protected results: {
    [key in string]: BenchmarkAttributes;
  } = {};
  protected allTokensForBlockchain: { [key in BlockchainsEnum]?: string[] } =
    {};

  public addProvider(providerName: string) {
    this.results[providerName] = {
      timeExec: {},
      tokens: {},
    };
  }

  public addExecTimeToProvider(
    providerName: string,
    blockchain: BlockchainsEnum,
    execTime: number
  ) {
    if (!(blockchain in this.results[providerName].timeExec)) {
      this.results[providerName].timeExec[blockchain] = [];
    }
    this.results[providerName].timeExec[blockchain]!.push(execTime);
  }

  public addTokensToProviderBlockchain(
    providerName: string,
    blockchain: BlockchainsEnum,
    tokens: string[]
  ) {
    if (!(blockchain in this.results[providerName].tokens)) {
      this.results[providerName].tokens[blockchain] = [];
    }
    this.results[providerName].tokens[blockchain] = Array.from(
      new Set<string>(
        this.results[providerName].tokens[blockchain]!.concat(tokens)
      )
    );

    if (!(blockchain in this.allTokensForBlockchain)) {
      this.allTokensForBlockchain[blockchain] = [];
    }
    this.allTokensForBlockchain[blockchain] = Array.from(
      new Set<string>(this.allTokensForBlockchain[blockchain]!.concat(tokens))
    );
  }

  protected getTimeStatistics(
    timeExec: BenchmarkTime
  ): BenchmarkTimeStatisticsResult {
    let totalTime = 0,
      count = 0,
      maxTime = 0,
      minTime = 0;

    let avgPerBlockchain: {
      [key in BlockchainsEnum]?: {
        total: number;
        count: number;
      };
    } = {};

    Object.keys(timeExec).forEach((blockchain) => {
      timeExec[blockchain as BlockchainsEnum]!.forEach((time) => {
        totalTime += time;
        count++;

        if (time > maxTime) {
          maxTime = time;
        }
        if (time < minTime || minTime === 0) {
          minTime = time;
        }

        if (!(blockchain in avgPerBlockchain)) {
          avgPerBlockchain[blockchain as BlockchainsEnum] = {
            total: 0,
            count: 0,
          };
        }
        avgPerBlockchain[blockchain as BlockchainsEnum]!.total += time;
        avgPerBlockchain[blockchain as BlockchainsEnum]!.count++;
      });
    });

    let ret: BenchmarkTimeStatisticsResult = {
      totalTime,
      count,
      avgTime: count > 0 ? totalTime / count : 0,
      maxTime,
      minTime,
    };

    Object.keys(avgPerBlockchain).forEach((blockchain) => {
      ret[`avgTimeFor${blockchain as BlockchainsEnum}`] =
        avgPerBlockchain[blockchain as BlockchainsEnum]!.count > 0
          ? avgPerBlockchain[blockchain as BlockchainsEnum]!.total /
            avgPerBlockchain[blockchain as BlockchainsEnum]!.count
          : 0;
    });

    return ret;
  }
  protected getTokenStatistics(
    tokens: BenchmarkToken
  ): BenchmarkTokenStatisticsResult {
    let ret: BenchmarkTokenStatisticsResult = {};

    Object.keys(tokens).forEach((blockchain) => {
      ret[`missingTokensFor${blockchain as BlockchainsEnum}`] =
        this.allTokensForBlockchain[blockchain as BlockchainsEnum]
          ?.filter((a) => !tokens[blockchain as BlockchainsEnum]!.includes(a))
          .join(", ");
    });

    return ret;
  }

  public getResults(): BenchmarkResultAttributes[] {
    return Object.keys(this.results)
      .map((providerName) => {
        let providerResult = this.results[providerName];

        return {
          provider: providerName,
          ...this.getTimeStatistics(providerResult.timeExec),
          ...this.getTokenStatistics(providerResult.tokens),
        };
      })
      .sort((a, b) => (a.avgTime ?? 0) - (b.avgTime ?? 0));
  }
}
