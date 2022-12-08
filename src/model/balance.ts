import { BlockchainsEnum } from "../enums/blockchains";

export type TokenBalance = {
  amount: string;
  token?: string;
  amountUsd?: string;
  blockchain?: BlockchainsEnum;
};
