import { BlockchainsEnum } from "../enums/blockchains";

export type TokenBalance = {
  amount: string;
  decimals: number;
  token?: string;
  amountUsd?: string;
  blockchain?: BlockchainsEnum;
};
