import { gotScraping } from 'got-scraping';
import fs from 'fs'
import c from 'chalk'

const log = console.log
const getRandom = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min)
  }

const getBoost = async (address: string) => {
    const req = gotScraping.extend({
        url: "https://api.reya.xyz",
    })

    log(c.blue(address + ":"), "check is boost expired")

  const isExpired = await gotScraping
    (`https://api.reya.xyz/api/xp/user-game-status/${address}`)
    .json()
    .then((r:any) => r.status === 'expired' )

  if (!isExpired) {
    log(c.blue(address + ":"), "boost is valid")
    return
  }
  
  const lockedInBoost = await req
    (
      `https://api.reya.xyz/api/xp/generate-game-boost-rate/${address}/child${getRandom(1,6)}`
    )
    .json()
    .then((r:any) => r.boostRate)

  const refferal_code = await req
    (`https://api.reya.xyz/api/xp/get-referral-code/${address}`)
    .json()
    .then((r:any) => r.referralCode)

  var bodyFormData = new FormData()
  bodyFormData.append('lockedInBoost', lockedInBoost)
  bodyFormData.append(
    'referralURL',
    `https://reya.network/lge?referredBy=${refferal_code}`
  )

  await req.post(
    'https://api.reya.xyz/api/twitter/lock-game-boost-twitter-url',
    {
        json: bodyFormData
    }
  )

  await req
    (`https://api.reya.xyz/api/xp/lock-game-boost-rate/${address}`)
    log(c.blue(address + ":"), c.green(`receive ${lockedInBoost} boost`))

}

const start = async () => {
    const addresses = fs.readFileSync("addresses.txt", 'utf-8').split('\n').map((i) => i.trim()).filter((i) => i.length > 0)
    for (const address of addresses) {
        await getBoost(address).catch((e) => log(c.red("error: "), e.message))
        await new Promise(res => {
            setTimeout(() => res(null),30000)
        })
    }    
}

start()
setInterval(start,3600000)