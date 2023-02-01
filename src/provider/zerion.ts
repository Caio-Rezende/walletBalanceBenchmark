import { HeadersInit } from "node-fetch";
import {
  BenchmarkProvider,
  BlockchainsEnum,
  ParamType,
  TokenBalance,
} from "../model";

export class ZerionBenchmark extends BenchmarkProvider {
  protected minIntervalBettweenRequestsInSeconds = 60 / 120;
  protected url: string =
    "https://api.zerion.io/v1/wallets/{:address}/positions/?currency=usd&filter[position_types]=wallet";
  protected method: string = "GET";
  protected mapBlockchainName: Record<string, BlockchainsEnum> = {
    arbitrum: BlockchainsEnum.arbitrum,
    avalanche: BlockchainsEnum.avalanche,
    "binance-smart-chain": BlockchainsEnum.bsc,
    ethereum: BlockchainsEnum.ethereum,
    fantom: BlockchainsEnum.fantom,
    optimism: BlockchainsEnum.optimism,
    polygon: BlockchainsEnum.polygon,
    solana: BlockchainsEnum.solana,
  };

  protected supportedBlockchains: string[] = [
    "arbitrum",
    "avalanche",
    "binance-smart-chain",
    "ethereum",
    "fantom",
    "optimism",
    "polygon",
    "solana",
  ];

  constructor(benchmarkChains: BlockchainsEnum[]) {
    super();
    this.prepareBlockchains(benchmarkChains);
  }

  protected getHeaders(): HeadersInit {
    const Authorization = `Basic ${Buffer.from(
      `${process.env.ZERION_USER_KEY ?? ""}:${
        process.env.ZERION_USER_PASS ?? ""
      }`
    ).toString("base64")}`;
    return {
      ...super.getHeaders(),
      Authorization,
    };
  }

  protected getParams(publicKey: string): ParamType[] {
    return [
      {
        blockchain: BlockchainsEnum.ethereum,
        url: this.url.replace("{:address}", publicKey),
      },
    ];
  }

  protected transformResponse(
    blockchain: BlockchainsEnum,
    ret: any
  ): TokenBalance[] {
    const positions = ret.data;
    return positions.map((pos: any) => ({
      blockchain:
        this.mapBlockchainName[
          pos?.relationships?.chain?.data?.id ?? "ethereum"
        ],
      token: pos.attributes?.fungible_info?.symbol,
      decimals: pos.attributes?.quantity?.decimals,
      amount: pos.attributes?.quantity?.int,
      amountUsd: pos.attributes?.value,
    }));
  }
}
