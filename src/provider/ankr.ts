import { BenchmarkProvider, BlockchainsEnum, ParamType, TokenBalance } from "../model";

export class ANKRBenchmark extends BenchmarkProvider {
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
    this.prepareBlockchains(benchmarkChains);
  }

  protected getParams(publicKey: string): ParamType[] {
    return [
      {
        blockchain: BlockchainsEnum.ethereum,
        url: this.url,
        body: {
          jsonrpc: "2.0",
          method: "ankr_getAccountBalance",
          params: {
            blockchain: this.queryingBlockchains,
            walletAddress: publicKey,
          },
          id: 1,
        },
      },
    ];
  }

  protected transformResponse(
    blockchain: BlockchainsEnum,
    ret: any
  ): TokenBalance[] {
    return ret?.result?.assets?.map((asset: any) => ({
      blockchain: this.mapBlockchainName[asset?.blockchain],
      token: asset?.tokenSymbol,
      amount: asset?.balance,
      amountUsd: asset?.balanceUsd,
    }));
  }
}
