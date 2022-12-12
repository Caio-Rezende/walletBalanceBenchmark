import fetch, { HeadersInit } from "node-fetch";
import {
  BenchmarkProvider,
  BlockchainsEnum,
  ParamType,
  TokenBalance,
} from "../model";

export class MoralisBenchmark extends BenchmarkProvider {
  protected minIntervalBettweenRequestsInSeconds = 60 / 1500;
  protected url: string =
    "https://deep-index.moralis.io/api/v2/{:address}/erc20?chain={:evm_chain}";
  protected urlNative: string =
    "https://deep-index.moralis.io/api/v2/{:address}/balance?chain={:evm_chain}";
  protected solanaUrl: string =
    "https://solana-gateway.moralis.io/account/mainnet/{:address}/portfolio";
  protected method: string = "GET";
  protected mapBlockchainName: Record<string, BlockchainsEnum> = {
    eth: BlockchainsEnum.ethereum,
    polygon: BlockchainsEnum.polygon,
    bsc: BlockchainsEnum.bsc,
    avalanche: BlockchainsEnum.avalanche,
    fantom: BlockchainsEnum.fantom,
    solana: BlockchainsEnum.solana,
  };

  protected supportedBlockchains: string[] = [
    "eth",
    "polygon",
    "bsc",
    "avalanche",
    "fantom",
    "solana",
  ];

  protected mapNativeToken: Record<string, string> = {
    [BlockchainsEnum.ethereum]: "ETH",
    [BlockchainsEnum.polygon]: "MATIC",
    [BlockchainsEnum.bsc]: "BNB",
    [BlockchainsEnum.avalanche]: "AVAX",
    [BlockchainsEnum.fantom]: "FTM",
    [BlockchainsEnum.solana]: "SOL",
  };

  constructor(benchmarkChains: BlockchainsEnum[]) {
    super();
    this.prepareBlockchains(benchmarkChains);
  }

  protected getHeaders(): HeadersInit {
    const AccessKey = process.env.MORALIS_API_KEY ?? "";
    return {
      ...super.getHeaders(),
      "X-API-Key": AccessKey,
    };
  }

  protected getParams(publicKey: string): ParamType[] {
    return this.queryingBlockchains.map((blockchain) => {
      let url: string;
      if (blockchain === "solana") {
        url = this.solanaUrl.replace("{:address}", publicKey);
      } else {
        url = this.url
          .replace("{:evm_chain}", blockchain)
          .replace("{:address}", publicKey);
      }

      return {
        blockchain: this.mapBlockchainName[blockchain],
        url,
        publicKey,
      };
    });
  }

  protected async fetch(params: ParamType): Promise<TokenBalance[]> {
    const ret = await super.fetch(params);

    if (params.blockchain !== BlockchainsEnum.solana) {
      const nativeRet = await this.fetchNative(params);
      return nativeRet.concat(ret);
    }

    return ret;
  }

  protected async fetchNative(params: ParamType): Promise<TokenBalance[]> {
    const url = this.urlNative
      .replace("{:evm_chain}", params.blockchain)
      .replace("{:address}", params.publicKey!);
    const nativeRet: any = await fetch(url, {
      method: this.method,
      headers: this.getHeaders(),
    });
    const retNativeJson = await nativeRet?.json();
    return [
      {
        amount: retNativeJson?.balance ?? 0,
        token: this.mapNativeToken[params.blockchain],
        blockchain: params.blockchain,
        decimals: 18,
      },
    ];
  }

  protected transformResponse(
    blockchain: BlockchainsEnum,
    ret: any
  ): TokenBalance[] {
    if (blockchain !== BlockchainsEnum.solana) {
      return ret?.map((asset: any) => ({
        blockchain,
        token: asset?.symbol,
        amount: asset?.balance,
        decimals: parseInt(asset?.decimals, 10)
      }));
    }

    return (
      ret?.tokens?.map((token: any) => ({
        blockchain,
        token: token?.associatedTokenAddress,
        amount: token?.amount,
        decimals: parseInt(token?.decimals, 10)
      })) ?? []
    ).concat(
      ret?.nativeBalance?.solana
        ? {
            blockchain,
            token: "SOL",
            amount: ret.nativeBalance.solana,
            decimals: 18
          }
        : []
    );
  }
}
