# Introduction

This is a benchmark project to test wallet balances cross chains from many providers.

See src/main.ts to config the blockchains you need to test and the publicKeys to test on them.

## env

Don't forget to setup your .env from .env.example and get api keys for the providers.

## included providers

> ankr
> bitquery
> blockchair
> covalenthq
> debank
> moralis

## supported networks

Notice the providers have different blockchains support, so to tweek that for your needs, check in the src/provider file to add more networks and in enums/blockchains.ts if needed.

# How to run

`npm run benchmark`

# Results format

```TypeScript
{
    [publicKey]: {
        [network]: {
            [provider]: {
                result: TokenBalance[];
                tokenList: string
            };
        };
    };
};
{
    [network]: {
        [provider]: {
            results: number[];
            avgTimer: number
        };
    };
};
{
    [provider]: {
        totalTime: number,
        count: number,
        avgTime: number
    },
};
```

# type

```TypeScript
type TokenBalance = {
    amount: string;
    token?: string;
    amountUsd?: string;
    blockchain?: BlockchainsEnum;
};
```
