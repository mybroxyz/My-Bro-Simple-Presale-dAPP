import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

import { config } from '../dapp.config'

export default function Home() {
  return (
    <div className="min-h-screen h-full w-full flex flex-col bg-navajoWhite overflow-hidden">
      <Head>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="min-w-full text-gray-800 py-14 px-4 md:px-0">
        <div className="flex items-center container mx-auto max-w-5xl justify-between h-full">
          {/* Logo */}
          <Link href="#">
            <a className="font-coiny text-xl md:text-3xl font-bold">
              <span className="bg-gradient-to-br from-brand-blue to-brand-purple pr-2 bg-clip-text text-transparent ">
              </span>
              Weekend Wankers NFTs
            </a>
          </Link>

          {/* Opensea Twitter Discord Links */}
          <nav aria-label="Contact Menu">
            <ul className="flex items-center space-x-4 md:space-x-6">


              <li className="cursor-pointer">
                <a
                  href="https://twitter.com/Weekend_Wankers"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    className="w-6 h-6 md:w-8 md:h-8"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
                  </svg>
                </a>
              </li>

              <li className="cursor-pointer">
                <a href="https://joepegs.com/" target="_blank" rel="noreferrer">
                  <svg
                    className="w-6 h-6 md:w-32 md:h-8"
                    viewBox="0 0 120 30"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.26562 0.517212H13.2812H16.3031H17.5062V19.2266H13.2812V4.16096H9.26562V0.517212ZM113.734 23.1859C117.528 23.1859 120 21.1922 120 18.1391C120 13.8065 116.855 13.3834 114.284 13.0375C112.506 12.7983 111.003 12.5961 111.003 11.1641C111.003 10.0703 111.934 9.4297 113.35 9.4297C114.603 9.4297 115.987 10.2016 116.209 11.7109H119.809C119.65 8.56407 117.047 6.47345 113.256 6.47345C109.916 6.47345 107.441 8.46407 107.441 11.2922C107.441 15.2597 110.421 15.7718 112.927 16.2024C114.743 16.5145 116.309 16.7836 116.309 18.2953C116.309 19.2578 115.281 20.0297 113.741 20.0297C111.972 20.0297 110.784 19.0672 110.622 17.5234H107.022L107.019 17.5266C107.212 21.0016 109.941 23.1859 113.734 23.1859ZM80.2344 23.186C84.2188 23.186 87.2375 20.9704 87.85 17.5329H83.9969C83.5781 19.0735 82.2625 19.911 80.2375 19.911C77.7313 19.911 76.0594 18.2391 75.7688 15.636H87.7219C87.7532 15.3141 87.7844 14.8329 87.7844 14.286C87.7844 10.4297 85.2156 6.47661 79.9125 6.47661C74.6094 6.47661 71.975 10.5266 71.975 14.7672C71.975 19.0079 74.9313 23.186 80.2344 23.186ZM79.9125 9.43286C82.2594 9.43286 83.6719 10.9766 83.8313 13.0329H75.8625C76.2813 10.5891 77.6969 9.43286 79.9125 9.43286ZM62.8688 23.1859C60.9094 23.1859 59.175 22.414 58.275 21.1609V29.4828H54.3563V6.73593H58.275V8.76092C59.2375 7.37967 61.0063 6.47968 63.1594 6.47968C67.8188 6.47968 70.6781 9.8828 70.6781 14.8328C70.6781 19.7797 67.625 23.1859 62.8688 23.1859ZM66.7594 14.8328C66.7594 11.8453 65.025 9.8828 62.4219 9.8828C59.8188 9.8828 58.0219 11.8453 58.0219 14.8328C58.0219 17.8203 59.7563 19.7828 62.4219 19.7828C65.0875 19.7828 66.7594 17.8203 66.7594 14.8328ZM19.0844 14.8454C19.0844 10.0485 22.6031 6.52975 27.5281 6.52975C32.4531 6.52975 35.9375 10.0485 35.9375 14.8485C35.9375 19.6454 32.4219 23.161 27.5281 23.161C22.6344 23.161 19.0844 19.6454 19.0844 14.8454ZM23.0469 14.8485C23.0469 17.7579 24.8375 19.7735 27.525 19.7735C30.2125 19.7735 31.9719 17.7579 31.9719 14.8485C31.9719 11.9391 30.1813 9.9235 27.525 9.9235C24.8688 9.9235 23.0469 11.936 23.0469 14.8485ZM40.7312 15.6484C41.0187 18.2391 42.6812 19.9016 45.1781 19.9016C47.1937 19.9016 48.5062 19.0703 48.9218 17.5328H52.7593C52.1531 20.9547 49.1437 23.1641 45.1781 23.1641C39.9 23.1641 36.9562 19.0047 36.9562 14.7828C36.9562 10.5609 39.5781 6.53282 44.8562 6.53282C50.1312 6.53282 52.6906 10.4672 52.6906 14.3047C52.6906 14.8484 52.6593 15.3297 52.6281 15.6484H40.7312ZM48.7593 13.0547C48.6 11.0078 47.1937 9.47345 44.8593 9.47345C42.65 9.47345 41.2437 10.6234 40.8281 13.0547H48.7593ZM13.2844 19.2266H6.80624V22.8704H13.2844V19.2266ZM101.687 21.1297C100.887 22.3828 99.0219 23.1859 96.9969 23.1859C92.1125 23.1859 89.2844 19.7828 89.2812 14.8328C89.2812 9.88593 92.1094 6.47968 96.9281 6.47968C98.9531 6.47968 100.719 7.31405 101.65 8.56717V6.73593H105.603V23.8266C105.603 27.1984 103.162 29.4797 99.5312 29.4797H91.5312V26.3328H98.9875C100.562 26.3328 101.687 25.1453 101.687 23.4422V21.1297ZM101.944 14.8328C101.944 11.8453 100.209 9.8828 97.5437 9.8828C94.875 9.8828 93.2062 11.8422 93.2062 14.8328C93.2062 17.8203 94.9094 19.7828 97.5437 19.7828C100.175 19.7828 101.944 17.8203 101.944 14.8328ZM3.125 15.5515H6.80312V19.2297H3.125V15.5515ZM2.575 12.4266H0V15.0016H2.575V12.4266Z" fill="currentColor"
                      ></path>
                  </svg>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="h-full w-full container max-w-5xl mx-auto flex flex-col items-center pt-4">
        <div className="flex flex-col items-center max-w-4xl w-full">

          <div className="flex flex-col md:flex-row md:space-x-16 space-y-10 items-center mt-20 w-full">
            {/* Ape Image */}
            <img
              src="/images/9.png"
              className="w-64 h-64 rounded-md object-cover"
            />

            <div className="flex flex-col md:items-start items-center justify-center text-center font-coiny text-gray-800 px-4 md:px-0 py-10 mt-14" style={{ whiteSpace: 'pre-line' }}>
              <h2 className="font-bold text-2xl md:text-4xl">
              Introducing the Weekend Wankers Project 
              </h2>

              <p className="mt-6 text-lg">
                {`1,111 Weekend Wankers on Avalanche
Wanklist Mint: January 21st, 4:20pm ET, Free for those Wanklisted, Max 1

Public Mint: January 21st, 4:30pm ET, 1 Avax, Max 10

This whole adventure kicked off when a few $avax influencers shared a copy pasta tweet, and their followers joined the fun, posting wallet addresses in the comments without realizing it was all part of a viral joke. That's where our lightbulb moment happened: Why not turn this wave of laughter into a gift of free NFTs for those commenters? With an energetic team by my side, we plunged into a frenzy of art creation, contract forging, and vibrant marketing. Our mission? To mix fun, ignite some wanking chaos, and craft something truly memorable. We're here to shake things up and create an NFT experience that's not just about the laughs but also holds real value. Ready to join the fun?`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
