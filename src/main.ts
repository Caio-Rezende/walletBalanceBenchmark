import * as dotenv from "dotenv";
dotenv.config();

import { getPublicKeys } from "./utils/get.public.keys";
import { Benchmark, BenchmarkProvider, BlockchainsEnum } from "./model";
import {
  ANKRBenchmark,
  BlockChairBenchmark,
  CovalentHQBenchmark,
  DebankBenchmark,
  MoralisBenchmark,
  BitQueryBenchmark,
  ZerionBenchmark,
} from "./provider";

const benchmarkChains: BlockchainsEnum[] = [
  BlockchainsEnum.arbitrum,
  BlockchainsEnum.avalanche,
  BlockchainsEnum.bsc,
  BlockchainsEnum.bitcoin,
  BlockchainsEnum.ethereum,
  BlockchainsEnum.fantom,
  BlockchainsEnum.klaytn,
  BlockchainsEnum.optimism,
  BlockchainsEnum.polygon,
  BlockchainsEnum.ronin,
  BlockchainsEnum.solana,
];

const providers: BenchmarkProvider[] = [
  new ANKRBenchmark(benchmarkChains),
  new BitQueryBenchmark(benchmarkChains),
  new BlockChairBenchmark(benchmarkChains),
  new CovalentHQBenchmark(benchmarkChains),
  new DebankBenchmark(benchmarkChains),
  new MoralisBenchmark(benchmarkChains),
  new ZerionBenchmark(benchmarkChains),
];

(async () => {
  console.time("main");

  const benchmark = new Benchmark();
  const publicKeys = getPublicKeys(benchmarkChains);

  await Promise.all(
    providers.map(async (provider: BenchmarkProvider) => {
      const providerName = provider.constructor.name;

      provider.addBenchmark(benchmark);
      benchmark.addProvider(providerName);

      let abort = false;
      for (let publicKey of publicKeys) {
        try {
          if (abort) continue;

          await provider.exec(publicKey);
        } catch (e: any) {
          abort = true;
          console.debug(e);
        }
      }
    })
  );

  console.log(JSON.stringify(BenchmarkProvider.balances));
  console.log(JSON.stringify(BenchmarkProvider.blockChainTimer));
  console.timeLog("main", "initiating benchmark comparison");

  const benchmarkResults = benchmark.getResults();
  console.log(JSON.stringify(benchmarkResults));

  console.timeEnd("main");
})();
