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
  publicMint,
  checkTimeLeftPresale,
  isAllowlisted
} from '../utils/interact'

export default function Mint() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const connectedWallets = useWallets()

  const [timeLeftPresale, setTimeLeftPresale] = useState(0);
  const [isAllowListed, setIsAllowListed] = useState(false);


  const [maxSupply, setMaxSupply] = useState(0)
  const [totalMinted, setTotalMinted] = useState(0)
  const [maxMintAmount, setMaxMintAmount] = useState(0)
  const [paused, setPaused] = useState(false)
  const [isPublicSale, setIsPublicSale] = useState(false)
  const [isPresale, setIsPresale] = useState(false)

  const [status, setStatus] = useState(null)
  const [mintAmount, setMintAmount] = useState(1)
  const presaleMintAmount = 0;
  const [isMinting, setIsMinting] = useState(false)
  const [onboard, setOnboard] = useState(null)




  useEffect(() => {
    const fetchAllowlistStatus = async () => {
      try {
        if (wallet && wallet.address) {
          const allowlistStatus = await isAllowListed(wallet.address);
          setIsAllowListed(allowlistStatus);
        }
      } catch (error) {
        console.error('Error fetching allowlist status:', error);
      }
    };
  
    fetchAllowlistStatus();
  }, []);
  


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
      setIsPublicSale(await isPublicSaleState())
      const isPresale = await isPresaleState()
      setIsPresale(isPresale)

      setMaxMintAmount(
        isPresale ? config.presaleMaxMintAmount : config.maxMintAmount
      )
    }

    init()
  }, [])


  useEffect(() => {
    const fetchTimeLeft = async () => {
      try {
        const timeLeftPresale = await checkTimeLeftPresale();
        //const timeLeftPublic = await checkTimeLeftPublic();
  
        // Set the timeLeft based on the sale type
        //setTimeLeft(isPresale ? timeLeftPresale : timeLeftPublic);
        setTimeLeft(timeLeftPresale);
      } catch (error) {
        console.error('Error fetching time left:', error);
      }
    };
  
    fetchTimeLeft();
  }, []);

  
  
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

    const { success, status } = await presaleMint(presaleMintAmount)

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
        setIsPublicSale(await isPublicSaleState());
        const presale = await isPresaleState();
        setIsPresale(presale);
        setMaxMintAmount(presale ? config.presaleMaxMintAmount : config.maxMintAmount);
        fetchTimeLeft();
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
    <div className="min-h-screen h-full w-full overflow-hidden flex flex-col items-center justify-center bg-navajoWhite ">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        

        <div className="flex flex-col items-center justify-center h-full w-full px-2 md:px-10">
          <div className="relative z-1 md:max-w-3xl w-full bg-gray-900/90 filter backdrop-blur-sm py-4 rounded-md px-2 md:px-10 flex flex-col items-center">
          {wallet && (
              <button
                className="absolute right-4 bg-yellow-600 transition duration-200 ease-in-out font-chalk border-2 border-[rgba(0,0,0,1)] shadow-[0px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none px-4 py-2 rounded-md text-sm text-white tracking-wide uppercase"
                onClick={() =>
                  disconnect({
                    label: wallet.label
                  })
                }
              >
                Disconnect
              </button>
            )}
            <h1 className="font-coiny uppercase font-bold text-3xl md:text-4xl bg-gradient-to-br  from-navajoWhite to-browner bg-clip-text text-transparent mt-3">
              {paused ? 'Paused' : isPresale ? 'Pre-Sale' : isPublicSale ? 'Public Sale' : "Wanking soon"}
            </h1>


            <div className="flex flex-col md:flex-row md:space-x-14 w-full mt-10 md:mt-14">
              <div className="relative w-full">
                <div className="font-coiny z-10 absolute top-2 left-2 opacity-80 filter backdrop-blur-lg text-base px-4 py-2 bg-black border border-brand-purple rounded-md flex items-center justify-center text-white font-semibold">
                  <p>
                    <span className="text-navajoWhite">{totalMinted}</span> /{' '}
                    {maxSupply}
                  </p>
                </div>

                <img
                  src="/images/13.png"
                  className="object-cover w-full sm:h-[280px] md:w-[250px] rounded-md"
                />
              </div>

              <div className="flex flex-col items-center w-full px-4 mt-16 md:mt-0">
                <div className="font-coiny flex items-center justify-between w-full">
                  <button
                    className="w-14 h-10 md:w-16 md:h-12 flex items-center justify-center text-brand-background hover:shadow-lg bg-browner font-bold rounded-md"
                    onClick={incrementMintAmount}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 md:h-8 md:w-8"
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

                  <p className="flex items-center justify-center flex-1 grow text-center font-bold text-navajoWhite text-3xl md:text-4xl">
                    {mintAmount}
                  </p>

                  <button
                    className="w-14 h-10 md:w-16 md:h-12 flex items-center justify-center text-brand-background hover:shadow-lg bg-browner font-bold rounded-md"
                    onClick={decrementMintAmount}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 md:h-8 md:w-8"
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
                </div>

                <p className="text-sm text-rose-200 tracking-widest mt-3">
                  Max Mint Amount: {maxMintAmount}
                </p>

                <div className="border-t border-b py-4 mt-16 w-full">
                  <div className="w-full text-xl font-coiny flex items-center justify-between text-navajoWhite">
                    <p> {(!isPresale&&!isPublicSale) ? '' : 'Total'}</p>

                    <div className="flex items-center space-x-3">
                      <p> 
                      {(!isPresale && !isPublicSale && !timeLeftPresale && wallet) ? `Weekend Wankers Coming in ${timeLeftPresale} minutes!` : (isPresale && !isPublicSale && !timeLeftPresale) ? '0' : (!isPresale && isPublicSale && !timeLeftPresale) ? Number.parseFloat(config.price * mintAmount).toFixed(0) : ''}
{' '}
                        {(!isPresale&&!isPublicSale) ? '' : 'AVAX'}
                      </p>{' '}
                      <span className="text-gray-400">{(!isPresale&&!isPublicSale) ? '' : '+ GAS'}</span>
                    </div>
                  </div>
                </div>

                {/* Mint Button && Connect Wallet Button */}
                {wallet ? (
                  <button
                    className={` ${
                      paused || isMinting || (!isPresale&&!isPublicSale)
                        ? 'bg-gradient-to-br from-navajoWhite to-browner shadow-lg cursor-not-allowed'
                        : 'bg-gradient-to-br from-navajoWhite to-browner shadow-lg hover:shadow-browner-400/50'
                    } font-coiny mt-12 w-full px-6 py-3 rounded-md text-2xl text-rose-500  mx-4 tracking-wide`}
                    disabled={paused || isMinting || (!isPresale&&!isPublicSale)}
                    onClick={isPresale ? presaleMintHandler : publicMintHandler}
                  >
                    {(!isPresale&&!isPublicSale) ? 'Wen?' : isMinting ? 'Minting...' : 'Mint'}
                  </button>
                ) : (
                  <button
                    className="font-coiny mt-12 w-full bg-gradient-to-br from-browner to-navajoWhite shadow-lg px-6 py-3 rounded-md text-2xl text-white hover:shadow-rose-400/50 mx-4 tracking-wide uppercase"
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
                  status.success ? 'border-green-500' : 'border-navajoWhite-400 '
                } rounded-md text-start h-full px-4 py-4 w-full mx-auto mt-8 md:mt-4"`}
              >
                <div className="flex flex-col space-y-2 text-white text-sm md:text-base break-words ...">
                  {status.message}
                </div>
              </div>
            )}

            {/* Contract Address */}
            <div className="border-t border-gray-800 flex flex-col items-center mt-10 py-2 w-full">

            {wallet && (
  <p className="font-coiny text-2xl text-rose-500 mt-6">
    {isPublicSale ? "" : isAllowListed ? '*Connected wallet is on wanklist' : '*Connected wallet is not wanklisted'}
  </p>
) } 

{!wallet && !isPublicSale && (
  <p className="font-coiny text-2xl text-rose-500 mt-6">
    *Connect wallet to check wanklist
  </p>
) } 


              <h3 className="font-coiny text-xl text-navajoWhite mt-6">
                Contract Address :
              </h3>
              <a
                href={`https://snowtrace.io/address/${config.contractAddress}/contract/43114/readProxyContract?chainId=43114`} //testnet.snowtrace.io   ${...}#code
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-400 mt-4"
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
