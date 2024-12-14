// Code for the Presale/IDO page of the DApp in file "pages/presale.js"
/* make note of _app.js:
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
*/

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { initOnboard } from '../utils/onboard' //We call init here instead of in _app.js
import { useConnectWallet, useSetChain, useWallets } from '@web3-onboard/react'
import { config } from '../dapp.config'

// ============== IMPORT PRESALE CONTRACT LOGIC ==============
import {
  getPhase,
  getTotalAvaxInContract,
  getUserAvaxDeposited,
  depositAvax,
  withdrawAllAvax,
  seedLP,
  claimTokens,
  airdropAll,
  getUserTokenBalance,
  isAirdropCompleted,
  isClaimed,
  getPresaleCountdown,
  getUserWhitelistData,
  getPublicSaleData
} from '../utils/interactPresale'

export default function Presale() {
  // ============== WEB3 ONBOARD HOOKS ==============
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const connectedWallets = useWallets()

  // ============== STATE VARIABLES ==============
  const [phase, setPhase] = useState(0)                 // Contract phase [0..4]
  const [userAvax, setUserAvax] = useState('0')         // AVAX user deposited
  const [contractAvax, setContractAvax] = useState('0') // AVAX in contract
  const [userTokenBalance, setUserTokenBalance] = useState('0')
  const [status, setStatus] = useState(null)

  const [buyAmount, setBuyAmount] = useState('1')       // Minimum 1 AVAX
  const [airdropDone, setAirdropDone] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [timer, setTimer] = useState(0)                 // Countdown for presale or WL

  // ============== AUTO-REFRESH ==============
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!wallet) return

        const currentPhase = await getPhase()
        setPhase(currentPhase)

        const totalAvax = await getTotalAvaxInContract()
        setContractAvax(totalAvax)

        const userDep = await getUserAvaxDeposited(wallet.accounts[0].address)
        setUserAvax(userDep)

        const userBal = await getUserTokenBalance(wallet.accounts[0].address)
        setUserTokenBalance(userBal)

        const globalAirdropDone = await isAirdropCompleted()
        setAirdropDone(globalAirdropDone)

        const userAlreadyClaimed = await isClaimed(wallet.accounts[0].address)
        setClaimed(userAlreadyClaimed)

        const countdown = await getPresaleCountdown()
        setTimer(countdown)
      } catch (error) {
        console.error('Error fetching presale data:', error)
      }
    }

    fetchData()
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 5000)
    return () => clearInterval(interval)
  }, [wallet])

  // ============== HANDLER: BUY PRESALE (PHASE 0) ==============
  const handleBuyPresale = async () => {
    if (!wallet) {
      setStatus({ success: false, message: 'Connect your wallet first.' })
      return
    }
    const avaxToBuy = parseFloat(buyAmount)
    if (avaxToBuy < 1) {
      setStatus({ success: false, message: 'Minimum 1 AVAX required.' })
      return
    }
    setStatus({ success: false, message: 'Sending transaction...' })

    try {
      const { success, message } = await depositAvax(avaxToBuy, wallet.accounts[0].address)
      setStatus({ success, message })
    } catch (err) {
      setStatus({ success: false, message: 'Transaction failed: ' + err.message })
    }
  }

  // ============== HANDLER: WITHDRAW ALL AVAX (PHASE 0 or 1) ==============
  const handleWithdrawAllAvax = async () => {
    setStatus({ success: false, message: 'Sending transaction...' })
    try {
      const { success, message } = await withdrawAllAvax(wallet.accounts[0].address)
      setStatus({ success, message })
    } catch (err) {
      setStatus({ success: false, message: 'Withdraw failed: ' + err.message })
    }
  }

  // ============== HANDLER: SEED LP (PHASE 1) ==============
  const handleSeedLP = async () => {
    setStatus({ success: false, message: 'Seeding LP...' })
    try {
      const { success, message } = await seedLP(wallet.accounts[0].address)
      setStatus({ success, message })
    } catch (err) {
      setStatus({ success: false, message: 'Seed LP failed: ' + err.message })
    }
  }

  // ============== HANDLER: CLAIM TOKENS (PHASE 2) ==============
  const handleClaimTokens = async () => {
    setStatus({ success: false, message: 'Claiming tokens...' })
    try {
      const { success, message } = await claimTokens(wallet.accounts[0].address)
      setStatus({ success, message })
    } catch (err) {
      setStatus({ success: false, message: 'Claim failed: ' + err.message })
    }
  }

  // ============== HANDLER: AIRDROP ALL (PHASE 2) ==============
  const handleAirdropAll = async () => {
    setStatus({ success: false, message: 'Airdropping to all...' })
    try {
      const { success, message } = await airdropAll()
      setStatus({ success, message })
    } catch (err) {
      setStatus({ success: false, message: 'AirdropAll failed: ' + err.message })
    }
  }

  // ============== REFRESH DATA MANUALLY ==============
  const refreshData = () => {
    setStatus({ success: false, message: 'Refreshing...' })
    // Data is auto-refreshed by useEffect anyway, but this can trigger a state update
  }

  // ============== RENDER ==============
  // We'll create a header for wallet connection & user stats, similar to "index.js" style

  return (
    <div
      className="flex flex-col w-full min-h-screen bg-cover bg-center m-0 p-0"
      style={{
        fontFamily: `'Almendra', serif`,
        backgroundImage: `url('/images/background.webp')`,
        backgroundPosition: 'top center',
        backgroundSize: '100% auto'
      }}
    >
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Almendra:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <title>Presale/IDO | MyBro</title>
        <meta name="description" content="Presale/IDO Page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-gray-900/80 py-4 shadow-md w-full">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4">
          {/* Logo */}
          <Link href="/">
            <a className="text-2xl md:text-5xl font-bold text-yellow-500 hover:text-yellow-400">
              MyBro.xyz
            </a>
          </Link>
          {/* Right side wallet info */}
          <div className="flex items-center space-x-4 text-yellow-300">
            {wallet ? (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <p className="text-sm">Wallet: {wallet.accounts[0].address.slice(0, 6)}...
                    {wallet.accounts[0].address.slice(-4)}
                  </p>
                  <p className="text-xs">BRO: {userTokenBalance} | AVAX in Presale: {userAvax}</p>
                </div>
                <button
                  onClick={() => disconnect({ label: wallet.label })}
                  className="bg-red-700 text-yellow-100 px-3 py-1 rounded text-sm"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={() => connect()}
                className="bg-green-700 text-yellow-100 px-4 py-2 rounded text-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Presale Content */}
      <main className="flex flex-col items-center py-10 px-4">
        <div className="container max-w-5xl mx-auto space-y-10">
          {/* Outer Box */}
          <div className="bg-gray-900/70 backdrop-blur-md rounded-3xl p-10 shadow-lg text-center">

            {/* Title / Phase Info */}
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">
              {`Phase: ${phase}`}
            </h2>
            <p className="text-yellow-200 text-sm md:text-base mb-6">
              Contract AVAX: {contractAvax} | Your AVAX Deposited: {userAvax}
            </p>
            
            {/* PHASE-SPECIFIC UI */}
            {phase === 0 && (
              <div className="flex flex-col items-center w-full space-y-4 mb-6">
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  className="w-60 p-2 rounded border border-gray-600 text-black"
                  placeholder="Amount in AVAX (min 1)"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                />
                <button
                  onClick={handleBuyPresale}
                  className="bg-gradient-to-br from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-yellow-100 px-6 py-3 rounded text-2xl font-bold"
                >
                  Buy Presale
                </button>
                <button
                  onClick={refreshData}
                  className="bg-gray-700 text-yellow-100 px-4 py-2 rounded"
                >
                  Refresh
                </button>
                <button
                  onClick={handleWithdrawAllAvax}
                  className="bg-red-700 text-yellow-100 px-4 py-2 rounded"
                >
                  Withdraw All AVAX
                </button>
              </div>
            )}

            {phase === 1 && (
              <div className="flex flex-col items-center w-full space-y-4 mb-6">
                <p className="text-yellow-100">Presale Ended. Seeding LP now:</p>
                <button
                  onClick={handleWithdrawAllAvax}
                  className="bg-red-700 text-yellow-100 px-4 py-2 rounded"
                >
                  Withdraw All AVAX
                </button>
                <button
                  onClick={handleSeedLP}
                  className="bg-green-700 text-yellow-100 px-4 py-2 rounded"
                >
                  Seed LP
                </button>
              </div>
            )}

            {phase === 2 && (
              <div className="flex flex-col items-center w-full space-y-4 mb-6">
                <p className="text-yellow-100">
                  LP Seeded. Token Dispersal Phase:
                </p>
                {!claimed && !airdropDone && (
                  <button
                    onClick={handleClaimTokens}
                    className="bg-purple-700 text-yellow-100 px-4 py-2 rounded"
                  >
                    Claim My Tokens
                  </button>
                )}
                {!airdropDone && (
                  <button
                    onClick={handleAirdropAll}
                    className="bg-blue-700 text-yellow-100 px-4 py-2 rounded"
                  >
                    Airdrop All
                  </button>
                )}
                {airdropDone && (
                  <p className="text-sm text-green-300">All tokens have been airdropped!</p>
                )}
              </div>
            )}

            {phase === 3 && (
              <div className="flex flex-col items-center w-full space-y-4 mb-6">
                <p className="text-yellow-100">
                  Whitelist Phase. Countdown to WL end: {timer} seconds
                </p>
                <p className="text-yellow-100">See how many tokens you can buy / have left, etc.</p>
                <button
                  onClick={refreshData}
                  className="bg-gray-700 text-yellow-100 px-4 py-2 rounded"
                >
                  Refresh
                </button>
              </div>
            )}

            {phase === 4 && (
              <div className="flex flex-col items-center w-full space-y-4 mb-6">
                <p className="text-yellow-100">Public Sale Live!</p>
                <p className="text-yellow-100">Total Collected (presale): {contractAvax}</p>
                <Link href="https://lfj.gg/avalanche/trade" passHref>
                  <a className="bg-gradient-to-br from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-yellow-100 px-6 py-3 rounded text-xl font-bold" target="_blank" rel="noopener noreferrer">
                    Buy on LFJ.gg
                  </a>
                </Link>
              </div>
            )}

            {/* Status Message */}
            {status && (
              <div
                className={`border ${
                  status.success ? 'border-green-500' : 'border-red-500'
                } rounded-md text-start px-4 py-4 w-full mx-auto mt-8 md:mt-4`}
              >
                <div className="flex flex-col space-y-2 text-white text-sm md:text-base break-words">
                  {status.message}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
// ============== END OF PAGE ==============