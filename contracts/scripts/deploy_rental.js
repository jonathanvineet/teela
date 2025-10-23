const hre = require('hardhat')

async function main() {
  const args = process.argv.slice(2)
  // simple arg parsing: --amountEth 0.01 --durationSec 3600
  const params = {}
  for (let i = 0; i < args.length; i += 2) {
    params[args[i].replace(/^--/, '')] = args[i + 1]
  }

  const amountEth = params.amountEth || '0.01'
  const durationSec = params.durationSec || '3600'

  console.log('Compiling...')
  await hre.run('compile')

  const RentalContract = await hre.ethers.getContractFactory('RentalContract')
  const rentalAmountWei = hre.ethers.parseEther(amountEth.toString())
  const duration = parseInt(durationSec, 10)

  console.log(`Deploying RentalContract rentalAmount=${amountEth} ETH duration=${duration} seconds`)
  const deployed = await RentalContract.deploy(rentalAmountWei, duration)
  await deployed.waitForDeployment()

  console.log('Deployed RentalContract at', deployed.target)
  console.log(JSON.stringify({ address: deployed.target, rentalAmountWei: rentalAmountWei.toString(), rentalDuration: duration }))
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
