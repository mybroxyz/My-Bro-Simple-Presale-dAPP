import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

import { config } from '../dapp.config'

export default function Home() {
  return (
    <div className="flex flex-col w-full h-full min-h-screen overflow-hidden bg-navajoWhite">
      <Head>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="min-w-full px-4 text-gray-800 py-14 md:px-0">
        <div className="container flex items-center justify-between h-full max-w-5xl mx-auto">
          {/* Logo */}
          <Link href="#">
            <a className="text-xl font-bold font-coiny md:text-3xl">
              <span className="pr-2 text-transparent bg-gradient-to-br from-brand-blue to-brand-purple bg-clip-text ">
              </span>
              Weekend Wankers NFTs
            </a>
          </Link>

          {/* Opensea Twitter Discord Links */}
          <nav aria-label="Contact Menu">
            <ul className="flex items-center space-x-4 md:space-x-6">
              <li className="cursor-pointer">
                <a href="https://hyperspace.xyz/collection/2571aEafC248cd79dA50af17b2Ef9E45912Ed027" target="_blank" rel="noreferrer">
                  <svg
                    className="w-6 h-6 md:w-8 md:h-8"
                    viewBox="0 0 116 116"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
d="M31.287 0H60.9294L37.859 49.4941C35.8401 53.8252 34.8307 55.9908 35.1365 57.6451C35.4056 59.1002 36.3657 60.2833 37.8793 61.0247C39.6 61.8676 42.3669 61.8676 47.9005 61.8676H47.9006H67.6623C69.0457 61.8676 69.7374 61.8676 70.1676 62.0783C70.546 62.2637 70.786 62.5595 70.8533 62.9232C70.9297 63.3368 70.6774 63.8782 70.1727 64.961L60.8003 85.068H39.0625C22.4612 85.068 14.1606 85.068 8.99839 82.5393C4.45761 80.315 1.57727 76.7658 0.770191 72.4004C-0.147334 67.4375 2.88095 60.9408 8.93751 47.9474L31.287 0ZM84.5172 116L54.8748 116L77.9453 66.5059C79.9642 62.1748 80.9736 60.0092 80.6677 58.3549C80.3987 56.8998 79.4386 55.7167 77.925 54.9753C76.2043 54.1324 73.4374 54.1324 67.9036 54.1324H48.142C46.7586 54.1324 46.0669 54.1324 45.6367 53.9217C45.2583 53.7363 45.0183 53.4405 44.951 53.0768C44.8745 52.6632 45.1269 52.1218 45.6316 51.039L55.004 30.932L76.7418 30.932C93.3431 30.932 101.644 30.932 106.806 33.4607C111.347 35.685 114.227 39.2342 115.034 43.5996C115.952 48.5625 112.923 55.0592 106.867 68.0526L84.5172 116Z" fill="currentColor"
                    ></path>
                  </svg>
                </a>
              </li>

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


            </ul>
          </nav>
        </div>
      </header>

      <div className="container flex flex-col items-center w-full h-full max-w-5xl pt-4 mx-auto">
        <div className="flex flex-col items-center w-full max-w-4xl">
          <Link href="/mint" passHref>
            <a className="inline-flex items-center px-6 mt-16 font-medium text-center rounded font-coiny oy-2 text-m sm:text-2xl md:text-3xl text-rose-400 hover:bg-rose-600 hover:text-white">
              Mint WANKER here
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 ml-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </Link>

          <div className="flex flex-col items-center w-full mt-20 space-y-10 md:flex-row md:space-x-16">
            {/* Ape Image */}
            <img
              src="/images/9.gif"
              className="object-cover w-64 h-64 rounded-md"
            />

            <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-gray-800 md:items-start font-coiny md:px-0 mt-14">
              <h2 className="text-2xl font-bold md:text-4xl">
                About Wankers...
              </h2>

              <p className="mt-6 text-lg">
                {`1,111 Weekend Wankers on Avalanche 🔺| Minting Date: Sunday, 4:20pm ET | Wanklist special mint | Created by @AvaxOcto`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
