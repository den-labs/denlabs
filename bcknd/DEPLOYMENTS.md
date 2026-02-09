# Spray Contract Deployments

## Contract Version

**Spray v2 (hardened)** - Solidity 0.8.20, OpenZeppelin 5.0.1

Security features: ReentrancyGuard, Pausable, SafeERC20, MAX_RECIPIENTS=200, custom errors, zero-address/zero-amount validation, rescue functions.

## Mainnet Deployments

| Network | Chain ID | Address | Version | Verified | Explorer |
|---------|----------|---------|---------|----------|----------|
| **Celo** | 42220 | `0xeC7062FbC96FCb685F48Cd6621258d9F7088e03a` | **v2** | Sourcify | [celoscan](https://celoscan.io/address/0xeC7062FbC96FCb685F48Cd6621258d9F7088e03a) |
| Ethereum | 1 | `0xB9Acfe176fae237915C865AF3444fAfF3aD24064` | v1 | | [etherscan](https://etherscan.io/address/0xB9Acfe176fae237915C865AF3444fAfF3aD24064) |
| Optimism | 10 | `0xe62c875ba6609E27c088F697dA16D47519b6B118` | v1 | | [optimistic.etherscan](https://optimistic.etherscan.io/address/0xe62c875ba6609E27c088F697dA16D47519b6B118) |
| Base | 8453 | `0x8C6c4Eaf07B5888629f8C5562a61fC79638c40e7` | v1 | | [basescan](https://basescan.org/address/0x8C6c4Eaf07B5888629f8C5562a61fC79638c40e7) |
| Avalanche | 43114 | `0xe62c875ba6609E27c088F697dA16D47519b6B118` | v1 | | [snowtrace](https://snowtrace.io/address/0xe62c875ba6609E27c088F697dA16D47519b6B118) |
| Avalanche Fuji | 43113 | `0x8C6c4Eaf07B5888629f8C5562a61fC79638c40e7` | v1 | | [testnet.snowtrace](https://testnet.snowtrace.io/address/0x8C6c4Eaf07B5888629f8C5562a61fC79638c40e7) |

### Retired (v1)

| Network | Address | Notes |
|---------|---------|-------|
| Celo | `0x062ad0B066bCfA6ce26C7EaD528363f7ff6483fe` | Replaced by v2 above |

## Testnet Deployments (v2 - hardened)

| Network | Chain ID | Address | Verified | Explorer |
|---------|----------|---------|----------|----------|
| Celo Sepolia | 11142220 | `0xf4f9988b7bCD93B5063a983Ae0Bb6678719AAe93` | Sourcify | [blockscout](https://celo-sepolia.blockscout.com/address/0xf4f9988b7bCD93B5063a983Ae0Bb6678719AAe93) |

## Deployers

| Network | Address |
|---------|---------|
| Celo Mainnet | `0x0924d1aFc2ECBd5257ee3b1302D978c3FFA7eba4` |
| Celo Sepolia | `0xC4E8a4A42637e2aC47384BD3763AD12251A9527d` |

## Upgrade Path

The Spray contract is **stateless** (no storage, no proxy). Upgrading means:

1. Deploy new contract to target network
2. Update `sprayAddress` in `src/lib/sprayNetworks.ts`
3. Frontend picks up new address on next build

Function signatures are unchanged between v1 and v2, so `SPRAY_ABI` in `src/modules/spray/constants.ts` does not need updating.

## Custom Errors (v2)

Frontend currently expects revert strings. v2 uses custom errors:

| Error | Parameters |
|-------|------------|
| `TooManyRecipients` | `(uint256 count, uint256 max)` |
| `ZeroAddress` | `(uint256 index)` |
| `ZeroAmount` | `(uint256 index)` |
| `LengthMismatch` | `(uint256 recipientsLength, uint256 amountsLength)` |
| `EmptyRecipients` | none |
| `IncorrectNativeValue` | `(uint256 sent, uint256 required)` |
| `InsufficientAllowance` | `(uint256 available, uint256 required)` |
| `InvalidTokenAddress` | none |

## Owner-Only Functions (v2)

| Function | Purpose |
|----------|---------|
| `pause()` | Halt all dispersals (emergency) |
| `unpause()` | Resume dispersals |
| `rescueNative()` | Withdraw accidentally sent native currency to owner |
| `rescueToken(address)` | Withdraw accidentally sent ERC20 tokens to owner |
