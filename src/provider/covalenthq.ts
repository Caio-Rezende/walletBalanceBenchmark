import { BenchmarkProvider, BlockchainsEnum, ParamType, TokenBalance } from "../model";

export class CovalentHQBenchmark extends BenchmarkProvider {
  protected minIntervalBettweenRequestsInSeconds = 60 / 300;
  protected url: string =
    "https://api.covalenthq.com/v1/{:chain}/address/{:address}/balances_v2/";
  protected method: string = "GET";
  protected mapBlockchainName: Record<string, BlockchainsEnum> = {
    "1": BlockchainsEnum.ethereum,
    "137": BlockchainsEnum.polygon,
    "56": BlockchainsEnum.bsc,
    "43114": BlockchainsEnum.avalanche,
    "250": BlockchainsEnum.fantom,
    "2020": BlockchainsEnum.ronin,
    "8217": BlockchainsEnum.klaytn,
    "1399811149": BlockchainsEnum.solana,
    "42161": BlockchainsEnum.arbitrum,
  };

  protected supportedBlockchains: string[] = [
    "1", //eth
    "137", //polygon
    "56", //bsc
    "43114", //avalanche
    "250", //fantom
    "2020", //ronin
    "8217", //klaytn
    "1399811149", //solana
    "42161", //arbitrum
  ];

  constructor(benchmarkChains: BlockchainsEnum[]) {
    super();
    this.prepareBlockchains(benchmarkChains);
  }

  protected getParams(publicKey: string): ParamType[] {
    const key = process.env.COVALENTHQ_API_KEY ?? "";

    return this.queryingBlockchains.map((blockchain) => {
      const params = new URLSearchParams({
        key,
      });

      return {
        blockchain: this.mapBlockchainName[blockchain],
        url: `${this.url
          .replace("{:chain}", blockchain)
          .replace("{:address}", publicKey)}?${params}`,
      };
    });
  }

  protected transformResponse(
    blockchain: BlockchainsEnum,
    ret: any
  ): TokenBalance[] {
    return ret?.data?.items?.map((asset: any) => ({
      blockchain,
      token: asset?.contract_ticker_symbol,
      amount: asset?.balance,
      amountUsd: asset?.quote,
      decimals: parseInt(asset?.contract_decimals, 10)
    }));
  }
}
