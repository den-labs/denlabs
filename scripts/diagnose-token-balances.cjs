/**
 * Diagnostic script to test token balance fetching across networks
 * Run with: node scripts/diagnose-token-balances.cjs <wallet-address>
 */

const { JsonRpcProvider, Contract, formatUnits } = require("ethers");

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const NETWORKS = {
  optimism: {
    name: "Optimism",
    chainId: 10,
    rpcUrl: "https://mainnet.optimism.io",
    tokens: [
      {
        symbol: "USDC",
        address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        decimals: 6,
      },
      {
        symbol: "OP",
        address: "0x4200000000000000000000000000000000000042",
        decimals: 18,
      },
    ],
  },
  base: {
    name: "Base",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    tokens: [
      {
        symbol: "USDC",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
      },
      {
        symbol: "WCT",
        address: "0xeF4461891DfB3AC8572cCf7C794664A8DD927945",
        decimals: 18,
      },
    ],
  },
  celo: {
    name: "Celo",
    chainId: 42220,
    rpcUrl: "https://forno.celo.org",
    tokens: [
      {
        symbol: "cUSD",
        address: "0x765DE816845861E75A25fCA122bb6898B8B1282a",
        decimals: 18,
      },
      {
        symbol: "USDC",
        address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
        decimals: 6,
      },
    ],
  },
  avalanche: {
    name: "Avalanche",
    chainId: 43114,
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    tokens: [
      {
        symbol: "USDC",
        address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        decimals: 6,
      },
    ],
  },
};

async function testNetwork(networkKey, walletAddress) {
  const network = NETWORKS[networkKey];
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing ${network.name} (chainId: ${network.chainId})`);
  console.log(`RPC: ${network.rpcUrl}`);
  console.log(`${"=".repeat(60)}`);

  try {
    const provider = new JsonRpcProvider(network.rpcUrl, {
      chainId: network.chainId,
      name: network.name,
    });

    // Test RPC connectivity
    console.log("\n1. Testing RPC connectivity...");
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✓ Connected! Latest block: ${blockNumber}`);

    // Test native balance
    console.log("\n2. Testing native balance...");
    const nativeBalance = await provider.getBalance(walletAddress);
    console.log(`   ✓ Native balance: ${formatUnits(nativeBalance, 18)}`);

    // Test each token
    console.log("\n3. Testing token balances...");
    for (const token of network.tokens) {
      try {
        const contract = new Contract(token.address, ERC20_ABI, provider);

        // Try to get symbol from contract
        let symbol = token.symbol;
        try {
          symbol = await contract.symbol();
        } catch {
          console.log(
            `   ⚠ Could not fetch symbol for ${token.address}, using configured: ${token.symbol}`,
          );
        }

        // Try to get decimals from contract
        let decimals = token.decimals;
        try {
          decimals = await contract.decimals();
        } catch {
          console.log(
            `   ⚠ Could not fetch decimals for ${token.address}, using configured: ${token.decimals}`,
          );
        }

        // Get balance
        const balance = await contract.balanceOf(walletAddress);
        const formattedBalance = formatUnits(balance, decimals);

        console.log(`   ✓ ${symbol} (${token.address}):`);
        console.log(`     Raw balance: ${balance.toString()}`);
        console.log(`     Formatted: ${formattedBalance}`);
        console.log(`     Decimals: ${decimals}`);
      } catch (error) {
        console.log(`   ✗ ${token.symbol} (${token.address}):`);
        console.log(`     Error: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`\n✗ Failed to connect to ${network.name}:`);
    console.log(`  Error: ${error.message}`);
  }
}

async function main() {
  const walletAddress = process.argv[2];

  if (!walletAddress) {
    console.log(
      "Usage: node scripts/diagnose-token-balances.cjs <wallet-address>",
    );
    console.log(
      "Example: node scripts/diagnose-token-balances.cjs 0x1234...abcd",
    );
    process.exit(1);
  }

  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.log("Error: Invalid wallet address format");
    process.exit(1);
  }

  console.log(`\nDiagnosing token balances for: ${walletAddress}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  for (const networkKey of Object.keys(NETWORKS)) {
    await testNetwork(networkKey, walletAddress);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("Diagnosis complete!");
  console.log(`${"=".repeat(60)}\n`);
}

main().catch(console.error);
