import type { EngagementRewardsSDK } from "@goodsdks/engagement-sdk";

export const checkEligibility = async (
  rewards: EngagementRewardsSDK,
  appAddress: `0x${string}`,
  userAddress: `0x${string}`,
) => {
  // Get app info returns a tuple, need to parse it
  const rawAppInfo = await rewards.getAppInfo(appAddress);

  // Parse the tuple into a more usable format
  // [owner, rewardReceiver, rewardAmount, expirationBlocks, minTimeBetweenClaims,
  //  maxAppClaimsWithinGracePeriod, gracePeriodForRepeatedClaims, requiresWhitelist, isPaused,
  //  description, url, email, proofValidator, appSigner]
  const appInfo = {
    userPercentage: rawAppInfo[3], // expirationBlocks position
    inviterPercentage: rawAppInfo[4], // minTimeBetweenClaims position
    description: rawAppInfo[9],
    url: rawAppInfo[10],
  };

  const can = await rewards.canClaim(appAddress, userAddress);

  return { can, appInfo };
};

export const claimReward = async (
  rewards: EngagementRewardsSDK,
  appAddress: `0x${string}`,
  _userAddress: `0x${string}`,
  inviter: `0x${string}`,
) => {
  // Get current block number to set validUntilBlock
  const currentBlock = BigInt(Date.now()); // Temporary, should be actual block
  const validUntilBlock = currentBlock + BigInt(1000); // Valid for 1000 blocks

  // 1. Sign the claim (SDK will request user signature)
  const userSignature = await rewards.signClaim(
    appAddress,
    inviter,
    validUntilBlock,
  );

  // 2. Get app signature (if needed by the contract)
  // For now, we'll use a simple nonce
  const nonce = BigInt(Date.now());

  // 3. Execute the non-contract app claim
  const receipt = await rewards.nonContractAppClaim(
    appAddress,
    inviter,
    nonce,
    userSignature,
    "0x" as `0x${string}`, // Empty app signature for now
  );

  return receipt.transactionHash;
};
