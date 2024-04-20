import { useState, useEffect } from 'react'
import { initOnboard } from '../utils/onboard'
import { useConnectWallet, useSetChain, useWallets } from '@web3-onboard/react'
import { config } from '../dapp.config'
import {
  getTotalMinted,
  getMaxSupply,
  isPausedState,
  isPublicSaleState,
  isPresaleState,
  presaleMint,
  publicMint
} from '../utils/interact'

export default function Mint() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const connectedWallets = useWallets()

  const [maxSupply, setMaxSupply] = useState(0)
  const [totalMinted, setTotalMinted] = useState(0)
  const [maxMintAmount, setMaxMintAmount] = useState(0)
  const [paused, setPaused] = useState(false)
  const [isPublicSale, setIsPublicSale] = useState(false)
  const [isPresale, setIsPresale] = useState(false)

  const [status, setStatus] = useState(null)
  const [mintAmount, setMintAmount] = useState(1)
  const [isMinting, setIsMinting] = useState(false)
  const [onboard, setOnboard] = useState(null)

  useEffect(() => {
    setOnboard(initOnboard)
  }, [])

  useEffect(() => {
    if (!connectedWallets.length) return

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    )
    window.localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connectedWalletsLabelArray)
    )
  }, [connectedWallets])

  useEffect(() => {
    if (!onboard) return

    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem('connectedWallets')
    )

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        await connect({
          autoSelect: {
            label: previouslyConnectedWallets[0],
            disableModals: true
          }
        })
      }

      setWalletFromLocalStorage()
    }
  }, [onboard, connect])

  useEffect(() => {
    const init = async () => {
      setMaxSupply(await getMaxSupply())
      setTotalMinted(await getTotalMinted())

      setPaused(await isPausedState())
      const isPublic = false//await isPresaleState() abc
      setIsPublicSale(isPublic)//await isPublicSaleState())  abc
      const isPresale = false//await isPresaleState() abc
      setIsPresale(isPresale)

      setMaxMintAmount(
        isPresale ? config.presaleMaxMintAmount : config.maxMintAmount
      )
    }

    init()
  }, [])

  const incrementMintAmount = () => {
    if (mintAmount < maxMintAmount) {
      setMintAmount(mintAmount + 1)
    }
  }

  const decrementMintAmount = () => {
    if (mintAmount > 1) {
      setMintAmount(mintAmount - 1)
    }
  }

  const presaleMintHandler = async () => {
    setIsMinting(true)

    const { success, status } = await presaleMint(mintAmount)

    console.log('Presale Mint Result:', { success, status });

    setStatus({
      success,
      message: status
    })

    setIsMinting(false)
        // Refresh the onboard wallet display
    if (success) {
      //if have onboard wallet display maybe can  refresh it        

        }
  }
  const publicMintHandler = async () => {
    setIsMinting(true)

    const { success, status } = await publicMint(mintAmount)

    setStatus({
      success,
      message: status
    })

    setIsMinting(false)

        // Refresh the onboard wallet display
        if (success) {
      //if have onboard wallet display maybe can  refresh it        
    }
  }


  useEffect(() => {
    const fetchData = async () => {
      try {
        setMaxSupply(await getMaxSupply());
        setTotalMinted(await getTotalMinted());
        setPaused(await isPausedState());
        setIsPublicSale(false)//await isPublicSaleState());
        const presale = false//await isPresaleState();
        setIsPresale(presale);

        setMaxMintAmount(presale ? config.presaleMaxMintAmount : config.maxMintAmount);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // Initial fetch
    fetchData();

    // Fetch data every 5 seconds
    const interval = setInterval(fetchData, 500);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen overflow-hidden bg-navajoWhite ">
      <div className="relative flex flex-col items-center justify-center w-full h-full">

        <div className="flex flex-col items-center justify-center w-full h-full px-2 md:px-10">
          <div className="relative flex flex-col items-center w-full px-2 py-4 rounded-md z-1 md:max-w-3xl bg-gray-900/90 filter backdrop-blur-sm md:px-10">
          {wallet && (
              <button
                className="absolute right-4 bg-browner transition duration-200 ease-in-out font-chalk border-2 border-green-100 shadow-[0px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none px-4 py-2 rounded-md text-sm text-green-100 tracking-wide uppercase"
                onClick={() =>
                  disconnect({
                    label: wallet.label
                  })
                }
              >
                Disconnect
              </button>
            )}
            <h1 className="mt-3 text-3xl font-bold text-transparent uppercase font-coiny md:text-5xl bg-gradient-to-br from-navajoWhite to-browner bg-clip-text">
              {paused ? 'Paused' : isPresale ? 'Pre-Sale' : isPublicSale ? 'Public Sale' : "Toking soon"}
            </h1>


            <div className="flex flex-col w-full mt-10 md:flex-row md:space-x-14 md:mt-14">
              <div className="relative w-full">
                <div className="absolute z-10 flex items-center justify-center px-4 py-2 text-base font-semibold text-green-100 bg-black border rounded-md font-coiny top-2 right-16 opacity-80 filter backdrop-blur-lg border-brand-purple">
                  <p>
                    <span className="text-navajoWhite">{totalMinted}</span> /{' '}
                    {maxSupply}
                  </p>
                </div>

                <img
                  src="/images/13.gif"
                  className="object-cover w-full sm:h-[280px] md:w-[250px] rounded-md"
                />
              </div>

              <div className="flex flex-col items-center w-full px-4 mt-16 md:mt-0">
                <div className="flex items-center justify-between w-full font-coiny">

                <button
                    className="flex items-center justify-center h-10 font-bold text-green-100 rounded-md w-14 md:w-16 md:h-12 hover:shadow-lg bg-browner"
                    onClick={decrementMintAmount}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 md:h-8 md:w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 12H6"
                      />
                    </svg>
                  </button>
                  <p className="flex items-center justify-center flex-1 text-3xl font-bold text-center text-green-100 grow md:text-4xl">
                    {mintAmount}
                  </p>
                  <button
                    className="flex items-center justify-center h-10 font-bold text-green-100 rounded-md w-14 md:w-16 md:h-12 hover:shadow-lg bg-browner"
                    onClick={incrementMintAmount}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 md:h-8 md:w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>

                </div>

                <p className="mt-3 font-bold text-green-100 text-m trackig-widest">
                  Max Mint Amount: {maxMintAmount}
                </p>

                <div className="w-full py-4 mt-16 border-t border-b">
                  <div className="flex items-center justify-between w-full text-xl font-coiny text-navajoWhite">
                    <p>{(!isPresale&&!isPublicSale) ? '' : 'Total'}</p>

                    <div className="flex items-center space-x-3">
                      <p>
                      {(!isPresale && !isPublicSale && wallet) ? `` : (isPresale && !isPublicSale) ? '0' : (!isPresale && isPublicSale) ? Number.parseFloat(config.price * mintAmount).toFixed(0) : ''}
{' '}
                        {(!isPresale&&!isPublicSale) ? '' : 'AVAX'}

                      </p>{' '}
                      <span className="text-green-100">{(!isPresale&&!isPublicSale) ? '' : '+ GAS'}</span>
                    </div>
                  </div>
                </div>

                {/* Mint Button && Connect Wallet Button */}
                {wallet ? (
                  <button
                    className={` ${
                      paused || isMinting || (!isPresale&&!isPublicSale)
                        ? 'bg-browner cursor-not-allowed'
                        : 'bg-gradient-to-br from-navajoWhite to-browner shadow-lg hover:shadow-rose-400/50'
                    } font-coiny mt-12 w-full px-6 py-3 rounded-md text-3xl text-green-100  mx-4 tracking-wide`}
                    disabled={paused || isMinting || (!isPresale&&!isPublicSale)}
                    onClick={isPresale ? presaleMintHandler : publicMintHandler}
                  >
                    {(!isPresale&&!isPublicSale) ? 'Wen?' : isMinting ? 'Minting...' : 'Mint'}
                  </button>
                ) : (
                  <button
                    className="w-full px-6 py-3 mx-4 mt-12 text-2xl tracking-wide text-green-100 rounded-md shadow-lg font-coiny bg-gradient-to-br from-browner to-navajoWhite hover:shadow-rose-400/50"
                    onClick={() => connect()}
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            {status && (
              <div
                className={`border ${
                  status.success ? 'border-green-500' : 'border-brand-pink-400 '
                } rounded-md text-start h-full px-4 py-4 w-full mx-auto mt-8 md:mt-4"`}
              >
                <div className="flex flex-col space-y-2 text-green-100 text-sm md:text-base break-words ...">
                  {status.message}
                </div>
              </div>
            )}

            {/* Contract Address */}
            <div className="flex flex-col items-center w-full py-2 mt-10 border-t border-navajoWhite">
            {wallet && (
  <p className="mt-6 text-2xl text-green-100 font-coiny">
    {isPublicSale ? '' : ''}
  </p>
) } 

{!wallet && !isPublicSale && (
  <p className="mt-6 text-2xl text-green-100 font-coiny">
     
  </p>
) } 


              <h3 className="mt-6 text-2xl text-green-100 font-coiny">
                Contract Address :
              </h3>
              <a
                href={`https://snowtrace.io/address/${config.contractAddress}/contract/43114/readProxyContract?chainId=43114`} //testnet.snowtrace.io   ${...}#code
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-green-100"
              >
                <span className="break-all ...">{config.contractAddress}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
