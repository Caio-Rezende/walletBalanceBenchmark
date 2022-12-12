import { HeadersInit } from "node-fetch";
import {
  BenchmarkProvider,
  BlockchainsEnum,
  ParamType,
  TokenBalance,
} from "../model";

export class BlockChairBenchmark extends BenchmarkProvider {
  protected minIntervalBettweenRequestsInSeconds = 60 / 30;
  protected url: string =
    "https://api.blockchair.com/{:chain}/dashboards/address/{:address}?erc_20=true&assets_in_usd=true";
  protected method: string = "GET";
  protected mapBlockchainName: Record<string, BlockchainsEnum> = {
    ethereum: BlockchainsEnum.ethereum,
    btc: BlockchainsEnum.bitcoin,
  };

  protected supportedBlockchains: string[] = ["ethereum", "btc"];

  protected getHeaders(): HeadersInit {
    const AccessKey = process.env.DEBANK_ACCESS_KEY ?? "";
    return {
      ...super.getHeaders(),
      AccessKey,
    };
  }

  constructor(benchmarkChains: BlockchainsEnum[]) {
    super();
    this.prepareBlockchains(benchmarkChains);
  }

  protected getParams(publicKey: string): ParamType[] {
    return this.queryingBlockchains.map((blockchain) => {
      return {
        blockchain: this.mapBlockchainName[blockchain],
        url: this.url
          .replace("{:chain}", blockchain)
          .replace("{:address}", publicKey),
      };
    });
  }

  protected transformResponse(
    blockchain: BlockchainsEnum,
    ret: any
  ): TokenBalance[] {
    if (blockchain === BlockchainsEnum.bitcoin) {
      const address = ret?.data[Object.keys(ret.data)[0]]?.address;
      return [
        {
          blockchain,
          token: "BTC",
          amount: address.balance,
          decimals: 18,
        },
      ];
    }

    const layer2Erc20 =
      ret?.data[Object.keys(ret.data)[0]]?.layer_2?.erc_20 ?? [];
    return layer2Erc20.map(
      (asset: any) =>
        ({
          blockchain,
          token: asset?.token_symbol,
          decimals: asset?.token_decimals,
          amount: asset?.balance_approximate,
          amountUsd: asset?.balance_usd,
        })
    );
  }
}
