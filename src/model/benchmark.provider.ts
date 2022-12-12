import fetch, { HeadersInit } from "node-fetch";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import { validate as validateBitCoinAddress } from "bitcoin-address-validation";

import {
  TOO_MANY_REQUESTS_EXCEPTION,
  FORBIDDEN_EXCEPTION,
  TEMPORARY_BLOCK_EXCEPTION,
  NOT_OK_EXCEPTION,
  TIMEOUT_EXCEPTION,
  SKIPABLE_EXCEPTION,
} from "../exception";
import { TokenBalance } from "./balance";
import { BlockchainsEnum } from "../enums/blockchains";
import { Benchmark } from "./benchmark";

const MAX_RETRY = 2;

export type ParamType = {
  url: string;
  body?: Object;
  blockchain: BlockchainsEnum;
  publicKey?: string;
};

export abstract class BenchmarkProvider {
  protected queryingBlockchains: string[] = [];
  protected minSleepMiliSeconds: number = 500;
  protected benchmark?: Benchmark;

  protected abstract minIntervalBettweenRequestsInSeconds: number;
  protected abstract url: string;
  protected abstract method: string;
  protected abstract supportedBlockchains: string[];
  protected abstract mapBlockchainName: Record<string, BlockchainsEnum>;

  public static blockChainTimer: {
    [key in string]: {
      [key in string]: { results: number[]; avgTimer: number };
    };
  } = {};

  public static balances: {
    [key in string]: {
      [key in string]: {
        [key in string]: { result: TokenBalance[]; tokenList: string };
      };
    };
  } = {};

  protected abstract getParams(publicKey: string): ParamType[];
  protected abstract transformResponse(
    blockchain: BlockchainsEnum,
    ret: any
  ): TokenBalance[];

  public addBenchmark(benchmark: Benchmark) {
    this.benchmark = benchmark;
  }

  public prepareBlockchains(benchmarkChains: BlockchainsEnum[]) {
    this.queryingBlockchains = benchmarkChains
      .map(
        (b) =>
          Object.keys(this.mapBlockchainName)[
            Object.values(this.mapBlockchainName).indexOf(b)
          ]
      )
      .filter((a) => a !== undefined);
  }

  public async exec(publicKey: string): Promise<void> {
    const paramsList = this.getParams(publicKey);

    for (let params of paramsList) {
      const timer = performance.now();

      await this.tryExec(publicKey, params);
      const diffTimer = performance.now() - timer;

      this.saveTimer(params.blockchain, diffTimer);

      await this.sleep();
    }
  }

  protected async sleep() {
    if (this.minSleepMiliSeconds > 0) {
      await new Promise((resolve) => {
        setTimeout(
          resolve,
          this.minSleepMiliSeconds +
            this.minIntervalBettweenRequestsInSeconds * 1000
        );
      });
    }
  }

  protected async tryExec(
    publicKey: string,
    params: ParamType,
    count: number = 0
  ) {
    try {
      await this.exectWithParams(publicKey, params);
    } catch (e: any) {
      if (!(e instanceof SKIPABLE_EXCEPTION)) {
        throw e;
      }
      if (++count < MAX_RETRY) {
        await this.sleep();
        this.tryExec(publicKey, params, count);
      }
    }
  }

  protected getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
    };
  }

  private sort(a: TokenBalance, b: TokenBalance): number {
    return (a.token ?? "").localeCompare(b.token ?? "");
  }

  private filter(a?: TokenBalance) {
    return (a?.token ?? "").toString().length > 0;
  }

  private async exectWithParams(publicKey: string, params: ParamType) {
    const blockchain = params.blockchain;

    if (!this.validateBlockchainPubliKey(blockchain, publicKey)) {
      return;
    }

    const retList = (await this.fetch(params))
      ?.filter(this.filter)
      ?.sort(this.sort);

    if (!retList) return;
    this.saveBalanceResult(blockchain, publicKey, retList);
  }

  private saveBalanceResult(
    blockchain: BlockchainsEnum,
    publicKey: string,
    retList: TokenBalance[]
  ) {
    if (!BenchmarkProvider.balances[publicKey]) {
      BenchmarkProvider.balances[publicKey] = {};
    }
    if (!BenchmarkProvider.balances[publicKey][blockchain]) {
      BenchmarkProvider.balances[publicKey][blockchain] = {};
    }
    const tokenList = Array.from(
      new Set<string>(
        retList.map((a) => a?.token ?? "").filter((a) => a.length > 0)
      )
    );
    BenchmarkProvider.balances[publicKey][blockchain][this.constructor.name] = {
      result: retList,
      tokenList: tokenList.join(", "),
    };
    this.benchmark?.addTokensToProviderBlockchain(
      this.constructor.name,
      blockchain,
      tokenList
    );
  }

  private saveTimer(blockchain: BlockchainsEnum, diffTimer: number) {
    this.benchmark?.addExecTimeToProvider(
      this.constructor.name,
      blockchain,
      diffTimer
    );
  }

  private validateBlockchainPubliKey(
    blockchain: BlockchainsEnum,
    publicKey: string
  ): boolean {
    switch (blockchain) {
      case BlockchainsEnum.ronin:
        return publicKey.startsWith("ronin:");
      case BlockchainsEnum.bitcoin:
        return validateBitCoinAddress(publicKey);
      case BlockchainsEnum.solana:
        if (
          /[^123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]/.test(
            publicKey
          )
        )
          return false;

        try {
          if (validateBitCoinAddress(publicKey)) {
            return false;
          }
          const address = new SolanaPublicKey(publicKey);
          return SolanaPublicKey.isOnCurve(address.toBuffer());
        } catch (e) {
          console.debug(e);
          return false;
        }
      default:
        return publicKey.startsWith("0x");
    }
  }

  protected async fetch({
    url,
    body,
    blockchain,
  }: ParamType): Promise<TokenBalance[]> {
    const ret = await fetch(url, {
      method: this.method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!ret.ok) {
      if (ret.status === 430) {
        throw new TEMPORARY_BLOCK_EXCEPTION();
      }
      if (ret.status === 429) {
        throw new TOO_MANY_REQUESTS_EXCEPTION();
      }
      if (ret.status === 403 || ret.status === 401) {
        throw new FORBIDDEN_EXCEPTION();
      }
      if (ret.status === 504 || ret.status === 406) {
        throw new TIMEOUT_EXCEPTION();
      }

      console.debug(ret);
      throw new NOT_OK_EXCEPTION();
    }

    const retJson = await ret.json();
    return this.transformResponse(blockchain, retJson);
  }
}
