// pages/presale.js

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { initOnboard } from '../utils/onboard'
import { useConnectWallet, useSetChain, useWallets } from '@web3-onboard/react'
import { config } from '../dapp.config'

// ============== PRESALE CONTRACT LOGIC ==============
import {
  getPhase,
  getTotalAvaxPresale,
  getUserAvaxDeposited,
  depositAvax,
  withdrawAllAvax,
  seedLP,
  claimTokens,
  airdropAll,
  getUserTokenBalance,
  isAirdropCompleted,
  isClaimed,
  getPresaleCountdown
} from '../utils/interactPresale'

// Utility function to format numbers with commas
const formatNumber = (num) => {
  if (!num) return '0';
  return parseFloat(num).toLocaleString('en-US', {
    minimumFractionDigits: 0, // Adjust decimal places as needed
    maximumFractionDigits: 2,
  });
};

// Utility function to format numbers with commas (no decimals for BRO)
const formatBroTokens = (num) => {
  if (!num) return '0';
  return parseInt(num).toLocaleString('en-US');
};


export default function Presale() {
  // ============== Onboard Setup (if not using `_app.js`) ==============
  const [onboard, setOnboard] = useState(null)
  useEffect(() => {
    setOnboard(initOnboard) // Initialize Onboard here if not in _app.js
  }, [])

  // ============== WEB3 ONBOARD HOOKS ==============
  const [{ wallet }, connect, disconnect] = useConnectWallet()
  const [{ }, setChain] = useSetChain()
  const connectedWallets = useWallets()

  // ============== STATE ==============
  const [phase, setPhase] = useState(0)          // Contract phase
  const [userWalletAvax, setUserWalletAvax] = useState('0')  // AVAX user has in wallet
  const [contractAvax, setContractAvax] = useState('0')      // AVAX in presale
  const [userTokenBalance, setUserTokenBalance] = useState('0')
  const [status, setStatus] = useState(null)
  const [buyAmount, setBuyAmount] = useState('1')
  const [airdropDone, setAirdropDone] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [timer, setTimer] = useState(0)          // Countdown
  const [userAvaxDeposited, setUserAvaxDeposited] = useState('0')


  // ============== Countdown Timers ==============

  const idoStartTime = 1735550400; // Replace this with the actual IDO start timestamp (in UNIX format)
  const presaleEndTime = idoStartTime - 2 * 60 * 60; // Presale ends 2 hours before IDO starts
  const [countdown, setCountdown] = useState({});

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000); // Current time in UNIX format
      const timeUntilIDO = idoStartTime - now;
      const timeUntilPresaleEnd = presaleEndTime - now;
      const timeUntilWLEnd = idoStartTime + 5 * 60 - now; // WL ends 5 minutes after IDO starts
  
      if (timeUntilPresaleEnd > 0) {
        setCountdown({
          label: 'Presale Ends In:',
          days: Math.floor(timeUntilPresaleEnd / (24 * 60 * 60)),
          hours: Math.floor((timeUntilPresaleEnd % (24 * 60 * 60)) / (60 * 60)),
          minutes: Math.floor((timeUntilPresaleEnd % (60 * 60)) / 60),
          seconds: timeUntilPresaleEnd % 60,
        });
      } else if (timeUntilIDO > 0) {
        setCountdown({
          label: 'IDO Begins In:',
          days: Math.floor(timeUntilIDO / (24 * 60 * 60)),
          hours: Math.floor((timeUntilIDO % (24 * 60 * 60)) / (60 * 60)),
          minutes: Math.floor((timeUntilIDO % (60 * 60)) / 60),
          seconds: timeUntilIDO % 60,
        });
      } else if (timeUntilWLEnd > 0) {
        setCountdown({
          label: 'WL Phase Ends In:',
          days: Math.floor(timeUntilWLEnd / (24 * 60 * 60)),
          hours: Math.floor((timeUntilWLEnd % (24 * 60 * 60)) / (60 * 60)),
          minutes: Math.floor((timeUntilWLEnd % (60 * 60)) / 60),
          seconds: timeUntilWLEnd % 60,
        });
      } else {
        setCountdown(null); // Countdown complete
      }
    };
  
    updateCountdown(); // Initial call
    const interval = setInterval(updateCountdown, 1000); // Update every second
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, [idoStartTime, presaleEndTime]);
  
  




  // ============== Phase Label Helper ==============
  const phaseLabels = [
    '$BRO PRESALE',
    '$BRO SEED LP',
    '$BRO AIRDROP',
    '$BRO WHITELISTED IDO',
    '$BRO PUBLIC SALE'
  ]

  // ============== Sync Wallet Info ==============
  // If user connects, store their wallet in localStorage
  useEffect(() => {
    if (!connectedWallets.length) return
    const labels = connectedWallets.map(({ label }) => label)
    window.localStorage.setItem('connectedWallets', JSON.stringify(labels))
  }, [connectedWallets])

  // Reconnect if user had a wallet connected before
  useEffect(() => {
    if (!onboard) return
    const previouslyConnected = JSON.parse(window.localStorage.getItem('connectedWallets'))
    if (previouslyConnected?.length) {
      connect({
        autoSelect: { label: previouslyConnected[0], disableModals: true }
      })
    }
  }, [onboard, connect])

  // ============== REFRESH DATA ==============
  const fetchData = async () => {
    try {
      if (!wallet) {
        setUserWalletAvax('0')
        setContractAvax('0')
        setUserTokenBalance('0')
        setUserAvaxDeposited('0')
        return
      }
      const currentPhase = await getPhase()
      setPhase(currentPhase)

      const totalAvaxPresale = await getTotalAvaxPresale(); // Fetch total collected
      setContractAvax(totalAvaxPresale); // Update state with the total collected

      const userDep = await getUserAvaxDeposited(wallet.accounts[0].address)
      setUserAvaxDeposited(userDep)

      const userBal = await getUserTokenBalance(wallet.accounts[0].address)
      setUserTokenBalance(userBal)

      // Get user's actual wallet AVAX balance
      const walletBalWei = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [wallet.accounts[0].address, 'latest']
      })
      const walletBal = parseFloat(parseInt(walletBalWei, 16) / 1e18).toFixed(3)
      setUserWalletAvax(walletBal.toString())

      const globalAirdropDone = await isAirdropCompleted()
      setAirdropDone(globalAirdropDone)

      const userAlreadyClaimed = await isClaimed(wallet.accounts[0].address)
      setClaimed(userAlreadyClaimed)

      const countdown = await getPresaleCountdown()
      setTimer(countdown)

        // Only clear the status if it's "Refreshing..."
        if (status && status.message === 'Refreshing...') {
            setStatus(null)
        }
        
    } catch (error) {
      console.error('Error fetching presale data:', error)
      setStatus({ success: false, message: 'Error fetching data.' })
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 30000)
    return () => clearInterval(interval)
  }, [wallet])

  // ============== Presale / IDO Handlers ==============
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
      if (success) {
        await fetchData(); // Refresh contract values
      }
    } catch (err) {
      setStatus({ success: false, message: 'Transaction failed: ' + err.message })
    }
  }

  const handleWithdrawAllAvax = async () => {
    setStatus({ success: false, message: 'Sending transaction...' })
    try {
      const { success, message } = await withdrawAllAvax(wallet.accounts[0].address)
      setStatus({ success, message })
      if (success) {
        await fetchData(); // Refresh contract values
      }
    } catch (err) {
      setStatus({ success: false, message: 'Withdraw failed: ' + err.message })
    }
  }

  const handleSeedLP = async () => {
    setStatus({ success: false, message: 'Seeding LP...' })
    try {
      const { success, message } = await seedLP(wallet.accounts[0].address)
      setStatus({ success, message })
      if (success) {
        await fetchData(); // Refresh contract values
      }
    } catch (err) {
      setStatus({ success: false, message: 'Seed LP failed: ' + err.message })
    }
  }

  const handleClaimTokens = async () => {
    setStatus({ success: false, message: 'Claiming tokens...' })
    try {
      const { success, message } = await claimTokens(wallet.accounts[0].address)
      setStatus({ success, message })
      if (success) {
        await fetchData(); // Refresh contract values
      }
    } catch (err) {
      setStatus({ success: false, message: 'Claim failed: ' + err.message })
    }
  }

  const handleAirdropAll = async () => {
    setStatus({ success: false, message: 'Airdropping to all...' });
    try {
      const { success, message } = await airdropAll(wallet.accounts[0].address); // Pass the user address here
      setStatus({ success, message });
      if (success) {
        await fetchData(); // Refresh contract values
      }
    } catch (err) {
      setStatus({ success: false, message: 'AirdropAll failed: ' + err.message });
    }
  };  

  const refreshData = async () => {
    setStatus({ success: false, message: 'Refreshing...' })
    await fetchData()
    setStatus({ success: true, message: 'Refreshed!' }) // Replace or clear message after refreshing
  }
  

  // ============== RENDER ==============
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
              🧙‍♂️
            </a>
          </Link>    
                    
          
          {/* Countdown Timer Display */}
          {countdown && (
            <div className="text-yellow-100 text-lg md:text-xl text-center my-0">
              <p className="font-bold">{countdown.label}</p>
              <p>
                {countdown.days > 0 && `${countdown.days}d `}
                {countdown.hours > 0 && `${countdown.hours}h `}
                {countdown.minutes > 0 && `${countdown.minutes}m `}
                {`${countdown.seconds}s`}
              </p>
            </div>
          )}


          {/* Right side wallet info */}
          <div className="flex items-center space-x-4 text-yellow-300">
            {wallet ? (
              <>
                <div className="flex flex-col items-end">
                  <p className="text-sm">
                    Wallet: {wallet.accounts[0].address.slice(0, 6)}...
                    {wallet.accounts[0].address.slice(-4)}
                  </p>
                  {parseFloat(userTokenBalance) > 0 && (
                    <p className="text-xs">
                      BRO: {formatBroTokens(userTokenBalance)}
                      </p>
                  )}
                  <p className="text-xs">
                    AVAX: {userWalletAvax}
                  </p>
                </div>
                {/*<button
                  onClick={() => disconnect({ label: wallet.label })}
                  className="bg-yellow-900 text-yellow-100 px-3 py-1 rounded text-sm"
                >
                  Disconnect
                </button>*/}
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
          <div className="bg-gray-900/70 backdrop-blur-md rounded-3xl p-10 shadow-lg text-center border border-yellow-900">
            
            {/* Title / Phase Info */}
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">
              {phaseLabels[phase] || 'PRESALE'}
            </h2>
            {/* 2-line display: total avax, user deposit */}
            <div className="flex flex-col md:flex-row items-center md:justify-between text-yellow-200 text-lg md:text-xl mb-6 w-full">
            <p className="md:text-left text-center w-full md:w-auto">Total AVAX in Presale: {formatNumber(contractAvax)}</p>
            <p className="md:text-right text-center w-full md:w-auto">Your AVAX Deposited: {formatNumber(userAvaxDeposited)}</p>
            </div>

            

            {/* Horizontal Line */}
            <hr className="border-yellow-500 mb-6 w-full" />

            {/* Sub-Box for Buttons and Inputs */}
            <div className="bg-gray-800/60 p-6 rounded-lg shadow-inner flex flex-col items-center space-y-6 border border-yellow-900">
              {/* PHASE-SPECIFIC UI */}
              {phase === 0 && (
                <div className="flex flex-col items-center w-full space-y-4">
                    <input
                    type="number"
                    min="1"
                    max={Math.floor((userWalletAvax - 0.001) * 10) / 10} // Max is user's balance minus gas, rounded down to nearest 0.1
                    step="0.1"
                    className="w-64 p-2 rounded bg-gray-700 border border-gray-600 text-2xl text-yellow-100"
                    placeholder="Amount in AVAX (min 1)"
                    value={buyAmount}
                    onChange={(e) => {
                        const inputValue = parseFloat(e.target.value);
                        const maxAmount = Math.floor((userWalletAvax - 0.001) * 10) / 10; // Correctly calculate max based on wallet balance and gas
                        if (inputValue > maxAmount) {
                        setBuyAmount(maxAmount); // Prevent input exceeding max
                        } else if (inputValue < 1) {
                        setBuyAmount(1); // Prevent input below minimum
                        } else {
                        setBuyAmount(e.target.value); // Accept valid input
                        }
                    }}
                    />




                  <button
                    onClick={handleBuyPresale}
                    className="bg-gradient-to-br from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-yellow-100 px-6 py-3 rounded text-3xl font-bold"
                  >
                    Buy Presale
                  </button>

                    <button
                    onClick={refreshData}
                    className="bg-gray-700 text-yellow-100 px-4 py-2 rounded text-lg font-semibold min-w-[9rem]"
                    >
                    Refresh
                    </button>
                
                  
                  <button
                    onClick={handleWithdrawAllAvax}
                    className="bg-yellow-900 text-yellow-100 px-4 py-2 rounded text-lg font-semibold"
                  >
                    Withdraw My AVAX
                  </button>

                </div>
              )}

              {phase === 1 && (
                <div className="flex flex-col items-center w-full space-y-4">
                  <p className="text-yellow-100 text-lg md:text-xl">Presale Ended. Seeding LP now:</p>
                  <button
                    onClick={handleWithdrawAllAvax}
                    className="bg-yellow-900 text-yellow-100 px-4 py-2 rounded text-lg font-semibold"
                  >
                    Withdraw My AVAX
                  </button>
                  <button
                    onClick={handleSeedLP}
                    className="bg-green-700 text-yellow-100 px-4 py-2 rounded text-lg font-semibold"
                  >
                    Seed LP
                  </button>
                </div>
              )}

              {phase === 2 && (
                <div className="flex flex-col items-center w-full space-y-4">
                  <p className="text-yellow-100 text-lg md:text-xl">AIRDROP TOKENS PHASE:</p>
                  {!claimed && !airdropDone && (
                    <button
                      onClick={handleClaimTokens}
                      className="bg-purple-700 text-yellow-100 px-4 py-2 rounded text-lg font-semibold"
                    >
                      Claim My Tokens
                    </button>
                  )}
                  {!airdropDone && (
                    <button
                      onClick={handleAirdropAll}
                      className="bg-blue-700 text-yellow-100 px-4 py-2 rounded text-lg font-semibold"
                    >
                      Airdrop All
                    </button>
                  )}
                  {airdropDone && (
                    <p className="text-m text-yellow-700">All tokens have been airdropped!</p>
                  )}
                </div>
              )}


              {phase === 3 && (
                <div className="flex flex-col items-center w-full space-y-4">
                  <p className="text-yellow-100 text-lg md:text-xl">Whitelisted trading is live!</p>

                  <Link href="https://lfj.gg/avalanche/trade" passHref>
                    <a
                      className="bg-gradient-to-br from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-yellow-100 px-6 py-3 rounded text-xl font-bold"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buy on LFJ.gg
                    </a>
                  </Link>
                </div>
              )}

              {phase === 4 && (
                <div className="flex flex-col items-center w-full space-y-4">
                  <p className="text-yellow-100 text-lg md:text-xl">Public trading is live!</p>

                  <Link href="https://lfj.gg/avalanche/trade" passHref>
                    <a
                      className="bg-gradient-to-br from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-yellow-100 px-6 py-3 rounded text-xl font-bold"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buy on LFJ.gg
                    </a>
                  </Link>
                </div>
              )}
            </div>

            {/* Status Message */}
            {status && (
              <>
                {/* Horizontal Line */}
                <hr className="border-yellow-500 mt-6 w-full" />
                <div
                  className={`border ${
                    status.success ? 'border-green-500' : 'border-red-800'
                  } rounded-md text-start px-4 py-4 w-full mx-auto mt-4`}
                >
                  <div className="flex flex-col space-y-2 text-white text-sm md:text-base break-words">
                    {status.message}
                  </div>
                </div>
              </>
            )}

            {/* Contract Address */}
            <div className="border-t border-yellow-900 flex flex-col items-center mt-10 py-4 w-full">
              <h3 className="text-xl text-yellow-700 mt-6">
                Contract Address :
              </h3>
              <a
                href={`https://testnet.snowtrace.io/address/0x5180062e63D7F796FDc9EF6a8DEF85C58899c24d#code`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-500 mt-4 break-all"
              >
                0x5180062e63D7F796FDc9EF6a8DEF85C58899c24d
              </a>


            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
