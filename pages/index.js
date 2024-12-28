// pages/index.js

import Head from 'next/head'
import Link from 'next/link'
import { config } from '../dapp.config'

export default function Home() {
  return (
    <div
      className="flex flex-col w-full min-h-screen bg-cover bg-center m-0 p-0"
      style={{
        fontFamily: `'Almendra', serif`,
        backgroundImage: `url('/images/background.webp')`,
        backgroundPosition: 'top center', // Aligns the image to the top
        backgroundSize: '100% auto', // Makes the width fit the screen
      }}
    >
      <Head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        {/* Google Font: Almendra */}
        <link
          href="https://fonts.googleapis.com/css2?family=Almendra:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header Section */}
      <header className="bg-gray-900/80 py-4 shadow-md w-full">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4">
          {/* Logo */}
          <Link href="https://www.mybro.xyz/">
            <a className="text-2xl md:text-5xl font-bold text-yellow-500 hover:text-yellow-400">
              MyBro.xyz
            </a>
          </Link>
          {/* LFJ.gg Link */}
          <Link href="https://lfj.gg/avalanche/trade">
            <a className="text-lg md:text-3xl font-bold text-yellow-500 hover:text-yellow-400">
              LFJ.gg
            </a>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center py-10 px-4">
        <div className="container max-w-5xl mx-auto space-y-10">
          {/* Info and Buy Section */}
          <div className="bg-gray-900/70 backdrop-blur-md rounded-3xl p-10 shadow-lg text-center">
            {/* Logo */}
            <img
              src="/images/broLogo.png"
              alt="Bro Logo"
              className="w-36 h-36 mx-auto mb-6 rounded-md"
            />

            {/* Description Box */}
            <div className="bg-gray-800/70 backdrop-blur-md p-6 max-w-2xl mx-auto mb-8 shadow-inner rounded-xl">
              <div className="text-lg md:text-3xl text-yellow-400 leading-relaxed space-y-6">
                <p>🧙‍♂️ $BRO fair launch on Avalanche!</p>
                <p>🌕 Join our presale to get whitelisted in the IDO.</p>
                <p>🍄 $BRO will be airdropped to presale buyers.</p>
                <p>⛏️ LP will be automatically created by the contract.</p>
              </div>
            </div>

            {/* Call-to-Action Box */}
            <div className="bg-gray-800/70 backdrop-blur-md p-8 max-w-lg mx-auto shadow-inner rounded-xl">
              <p className="text-xl md:text-2xl text-yellow-300 leading-relaxed mb-6">
                💫 Send at least 1 AVAX directly to the contract address, or click the link below to enter the presale:
              </p>
              <Link href="/presale" passHref>
                <a className="inline-flex items-center justify-center px-8 py-4 text-2xl md:text-3xl font-bold text-yellow-100 rounded bg-gradient-to-br from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 transition-transform transform hover:scale-105">
                  Buy $BRO
                </a>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
