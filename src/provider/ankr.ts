import { Benchmark, BlockchainsEnum, ParamType, TokenBalance } from "../model";

export class ANKRBenchmark extends Benchmark {
  protected minIntervalBettweenRequestsInSeconds = 60 / 30000;
  protected url: string = "https://rpc.ankr.com/multichain";
  protected method: string = "POST";
  protected mapBlockchainName: Record<string, BlockchainsEnum> = {
    eth: BlockchainsEnum.ethereum,
    polygon: BlockchainsEnum.polygon,
    bsc: BlockchainsEnum.bsc,
    avalanche: BlockchainsEnum.avalanche,
    fantom: BlockchainsEnum.fantom,
    arbitrum: BlockchainsEnum.arbitrum,
    optimism: BlockchainsEnum.optimism,
  };

  protected supportedBlockchains: string[] = [
    "polygon",
    "eth",
    "bsc",
    "fantom",
    "avalanche",
    "arbitrum",
    "optimism",
  ];

  constructor(benchmarkChains: BlockchainsEnum[]) {
    super();
    this.prepareBlockChains(benchmarkChains);
  }

  protected getParams(publicKey: string): ParamType[] {
    return this.blockChains.map((blockchain: string) => ({
      blockchain: this.mapBlockchainName[blockchain],
      url: this.url,
      body: {
        jsonrpc: "2.0",
        method: "ankr_getAccountBalance",
        params: {
          blockchain,
          walletAddress: publicKey,
        },
        id: 1,
      },
    }));
  }

  protected transformResponse(
    blockchain: BlockchainsEnum,
    ret: any
  ): TokenBalance[] {
    return ret?.result?.assets?.map((asset: any) => ({
      blockchain,
      token: asset?.tokenSymbol,
      amount: asset?.balance,
      amountUsd: asset?.balanceUsd,
    }));
  }
}
