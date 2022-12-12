import { BlockchainsEnum } from "../model";

import genericJson from "../../query-results/1.json" assert { type: "json" };
import bscJson from "../../query-results/2.json" assert { type: "json" };
import polygonJson from "../../query-results/3.json" assert { type: "json" };
import roninJson from "../../query-results/4.json" assert { type: "json" };
import avaKlaytnJson from "../../query-results/5.json" assert { type: "json" };
import solanaFTMJson from "../../query-results/6.json" assert { type: "json" };

const TEST_ADDRESSES = [
  "0x1d17371f4502357942b199cb0de90c6821f01fa5", //eth
  "0x9adb88d3c48b8a0bcbe88b9d2b351a1fc768edc1", //bsc
  "0x38a7e25a4b7ce22f3e51b62672fc7bd9d82dc6dc", //avalanche
  "0x0ac5018cd80820184fcf2828cc8f973b71c1dc0a", //bsc
  "0xa20863ebd65d24dd3d96083533c8502f150644af", //polygon
  "0x8d62c6f79e8a526fb575dd2fe3aaf2f841c42635", //polygon
  "ronin:3b43a8be1b7c173575ca4dc7b223a1ac7baaaf80", //ronin
  "ronin:41ea8053d7a3cfe6e755c658d8b8a04478eeb26b", //ronin
  "0x9696ece5ce9e73624351754b0e6dc93518c0ab76", //klay
  "AT3MJdtURZvWisMciEUW1Ngt6EqAxF2CbUo94PszW7Ko", //solana
  "341XXhcZ9QfWEnVdtt5RCD5BUgfjLKnKwr", //btc
  "0x1111111254fb6c44bAC0beD2854e76F90643097d", //polygon - dev
];

export function getPublicKeys(
  benchmarkChains: BlockchainsEnum[],
  skipTestAdresses: boolean = false,
  limitPublicKeys: number | undefined = undefined
): string[] {
  const ethereumPublicKeys = genericJson
    .filter((a) => a.f0_.includes("ETH"))
    .map((a) => a.userPublicKey);

  const bscPublicKeys = bscJson.map((a) => a.userPublicKey);

  const polygonPublicKeys = polygonJson.map((a) => a.userPublicKey);

  const roninPublicKeys = roninJson.map((a) => a.userPublicKey);

  const avalanchePublicKeys = avaKlaytnJson
    .filter((a) => a.blockchainId === "43114")
    .map((a) => a.userPublicKey);

  const klaytnPublicKeys = avaKlaytnJson
    .filter((a) => a.blockchainId === "8217")
    .map((a) => a.userPublicKey);

  const solanaPublicKeys = solanaFTMJson
    .filter((a) => a.blockchainId === "SOLANA")
    .map((a) => a.userPublicKey);

  const startSlice = skipTestAdresses ? TEST_ADDRESSES.length : 0;
  const endSlice = limitPublicKeys
    ? limitPublicKeys + startSlice
    : undefined;

  return Array.from(
    new Set<string>(
      TEST_ADDRESSES.concat(
        benchmarkChains.includes(BlockchainsEnum.ethereum)
          ? ethereumPublicKeys
          : [],
        benchmarkChains.includes(BlockchainsEnum.bsc) ? bscPublicKeys : [],
        benchmarkChains.includes(BlockchainsEnum.polygon)
          ? polygonPublicKeys
          : [],
        benchmarkChains.includes(BlockchainsEnum.ronin) ? roninPublicKeys : [],
        benchmarkChains.includes(BlockchainsEnum.avalanche)
          ? avalanchePublicKeys
          : [],
        benchmarkChains.includes(BlockchainsEnum.klaytn)
          ? klaytnPublicKeys
          : [],
        benchmarkChains.includes(BlockchainsEnum.solana) ? solanaPublicKeys : []
      )
    ) // Set used to have unique entries in final array
  ).slice(startSlice, endSlice);
}
