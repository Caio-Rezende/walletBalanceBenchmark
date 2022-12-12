import { HeadersInit } from "node-fetch";
import { BenchmarkProvider, BlockchainsEnum, ParamType, TokenBalance } from "../model";

export class DebankBenchmark extends BenchmarkProvider {
  protected minIntervalBettweenRequestsInSeconds = 60 / 6000;
  protected url: string = "https://pro-openapi.debank.com/v1/user/token_list";
  protected method: string = "GET";
  protected mapBlockchainName: Record<string, BlockchainsEnum> = {
    eth: BlockchainsEnum.ethereum,
    matic: BlockchainsEnum.polygon,
    bsc: BlockchainsEnum.bsc,
    avax: BlockchainsEnum.avalanche,
  };

  protected supportedBlockchains: string[] = ["matic", "eth", "bsc", "avax"];

  constructor(benchmarkChains: BlockchainsEnum[]) {
    super();
    this.prepareBlockchains(benchmarkChains);
  }

  protected getHeaders(): HeadersInit {
    const AccessKey = process.env.DEBANK_ACCESS_KEY ?? "";
    return {
      ...super.getHeaders(),
      AccessKey,
    };
  }

  protected getParams(publicKey: string): ParamType[] {
    return this.queryingBlockchains.map((blockchain) => {
      const params = new URLSearchParams({
        id: publicKey,
        chain_id: blockchain,
      });

      return {
        blockchain: this.mapBlockchainName[blockchain],
        url: `${this.url}?${params}`,
      };
    });
  }

  protected transformResponse(
    blockchain: BlockchainsEnum,
    ret: any
  ): TokenBalance[] {
    return ret?.map((asset: any) => ({
      blockchain,
      token: asset?.symbol,
      amount: asset?.balance,
      amountUsd: asset?.price,
      decimals: parseInt(asset?.decimals, 10)
    }));
  }
}
