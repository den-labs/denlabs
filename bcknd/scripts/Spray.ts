import { ethers, upgrades } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', balance.toString())

  const Spray = await ethers.getContractFactory('Spray')

  const feeData = await ethers.provider.getFeeData()
  // Celo's public RPCs (including Sepolia) intermittently return malformed
  // signatures when the transaction is type-2. Force a legacy (type-0)
  // transaction and pick a gasPrice that is safely above the latest base fee.
  const base = feeData.lastBaseFeePerGas ?? feeData.gasPrice ?? 0n
  const gasPrice =
    base > 0n ? (base * 12n) / 10n /* 1.2x */ : ethers.parseUnits('5', 'gwei')

  const spray = await Spray.deploy(deployer.address, {
    gasPrice,
    type: 0,
    gasLimit: 3_000_000,
  })

  await spray.waitForDeployment()

  console.log(`Spray deployed to: ${await spray.getAddress()}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
