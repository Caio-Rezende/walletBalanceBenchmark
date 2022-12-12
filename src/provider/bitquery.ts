import { HeadersInit } from "node-fetch";
import { BenchmarkProvider, BlockchainsEnum, ParamType, TokenBalance } from "../model";

export class BitQueryBenchmark extends BenchmarkProvider {
  protected minIntervalBettweenRequestsInSeconds = 60 / 10;
  protected url: string = "https://graphql.bitquery.io";
  protected method: string = "POST";
  protected mapBlockchainName: Record<string, BlockchainsEnum> = {
    ethereum: BlockchainsEnum.ethereum,
    matic: BlockchainsEnum.polygon,
    bsc: BlockchainsEnum.bsc,
    avalanche: BlockchainsEnum.avalanche,
    fantom: BlockchainsEnum.fantom,
    klaytn: BlockchainsEnum.klaytn,
    solana: BlockchainsEnum.solana,
    bitcoin: BlockchainsEnum.bitcoin,
  };

  protected supportedBlockchains: string[] = [
    "ethereum",
    "matic",
    "bsc",
    "avalanche",
    "fantom",
    "klaytn",
    "solana",
    "bitcoin",
  ];

  constructor(benchmarkChains: BlockchainsEnum[]) {
    super();
    this.prepareBlockchains(benchmarkChains);
  }

  protected getHeaders(): HeadersInit {
    const xApiKey = process.env.BITQUERY_API_KEY ?? "";
    return {
      ...super.getHeaders(),
      "X-API-KEY": xApiKey,
    };
  }

  protected getQuery(blockchain: BlockchainsEnum, publicKey: string) {
    switch (blockchain) {
      case BlockchainsEnum.solana:
        return `{
    solana(network: ${blockchain}) {
      address(address: {is: "${publicKey}"}) {
        balance
      }
    }
  }
  `;
      case BlockchainsEnum.bitcoin:
        return `{
  bitcoin(network: ${blockchain})  {
    inputs(
      inputAddress: {is: "${publicKey}"}) {
      value
    }
    outputs( outputAddress: {is: "${publicKey}"}) {
      value
    }
  }
}
`;
      default:
        return `{
  ethereum(network: ${blockchain}) {
    address(address: {is: "${publicKey}"}) {
      balances {
        currency {
          symbol
        }
        value
      }
    }
  }
}
`;
    }
  }

  protected getParams(publicKey: string): ParamType[] {
    return this.queryingBlockchains.map((blockchain) => ({
      blockchain: this.mapBlockchainName[blockchain],
      url: this.url,
      body: {
        variables: {},
        query: this.getQuery(this.mapBlockchainName[blockchain], publicKey),
      },
    }));
  }

  protected transformResponse(
    blockchain: BlockchainsEnum,
    ret: any
  ): TokenBalance[] {
    switch (blockchain) {
      case BlockchainsEnum.solana:
        const balance = ret?.data?.solana?.address?.[0]?.balance;
        return [
          {
            blockchain,
            token: "SOL",
            amount: balance,
          },
        ];
      case BlockchainsEnum.bitcoin:
        const value = ret?.data?.bitcoin?.outputs?.[0]?.value;
        return [
          {
            blockchain,
            token: "BTC",
            amount: value,
          },
        ];
      default:
        return ret?.data?.ethereum?.address?.[0]?.balances?.map(
          (asset: any) => ({
            blockchain,
            token: asset?.currency?.symbol,
            amount: asset?.value,
          })
        );
    }
  }
}
