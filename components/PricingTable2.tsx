'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function PricingTable2() {
  const [isAnnual, setIsAnnual] = useState<boolean>(false);

  return (
    <div>
      <p className="text-center py-6 text-2xl font-bold">
        Free tier without limitations. Upgrade to get more features
      </p>

      <div className="flex justify-center max-w-[14rem] m-auto mb-8 lg:mb-16">
        <div className="relative flex w-full p-1 bg-white dark:bg-slate-900 rounded-full">
          <span
            className="absolute inset-0 m-1 pointer-events-none"
            aria-hidden="true"
          >
            <span
              className={`absolute inset-0 w-1/2 bg-indigo-500 rounded-full shadow-sm shadow-indigo-950/10 transform transition-transform duration-150 ease-in-out ${
                isAnnual ? 'translate-x-0' : 'translate-x-full'
              }`}
            ></span>
          </span>
          <button
            className={`relative flex-1 text-sm font-medium h-8 rounded-full focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150 ease-in-out ${
              isAnnual ? 'text-white' : 'text-slate-500 dark:text-slate-400'
            }`}
            onClick={() => setIsAnnual(true)}
            aria-pressed={isAnnual}
          >
            Yearly{' '}
            <span
              className={`${
                isAnnual
                  ? 'text-indigo-200'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              -16%
            </span>
          </button>
          <button
            className={`relative flex-1 text-sm font-medium h-8 rounded-full focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150 ease-in-out ${
              isAnnual ? 'text-slate-500 dark:text-slate-400' : 'text-white'
            }`}
            onClick={() => setIsAnnual(false)}
            aria-pressed={isAnnual}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="max-w-sm mx-auto grid gap-6 lg:grid-cols-4 items-start lg:max-w-none">
        {/* Pricing tab 1 */}
        <div className="h-full">
          <div className="relative flex flex-col h-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 shadow shadow-slate-950/5">
            <div className="mb-5">
              <div className="text-slate-900 dark:text-slate-200 font-semibold mb-1">
                Totally free - no credit card
              </div>
              <div className="inline-flex items-baseline mb-2">
                <span className="text-slate-900 dark:text-slate-200 font-bold text-3xl">
                  $
                </span>
                <span className="text-slate-900 dark:text-slate-200 font-bold text-4xl">
                  {isAnnual ? 0 : 0}
                </span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <div className="text-sm text-slate-500 mb-5">
                Self-host all the open-source automations + unlimited workflows
              </div>
              <Link
                className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150"
                href="/"
              >
                Use automations
              </Link>
            </div>
            <ul className="text-slate-600 dark:text-slate-400 text-sm space-y-3 grow">
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>
                  Ability to self-host Bluewind entirely on your own Windmill
                  instance
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>Unlimited workflow executions</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>All automations open-source</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>Community support on Discord</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pricing tab 2 */}
        <div className="h-full">
          <div className="relative flex flex-col h-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 shadow shadow-slate-950/5">
            <div className="mb-5">
              <div className="text-slate-900 dark:text-slate-200 font-semibold mb-1">
                Starter
              </div>
              <div className="inline-flex items-baseline mb-2">
                <span className="text-slate-900 dark:text-slate-200 font-bold text-3xl">
                  $
                </span>
                <span className="text-slate-900 dark:text-slate-200 font-bold text-4xl">
                  {isAnnual ? 142 : 169}
                </span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <div className="text-sm text-slate-500 mb-5">
                Save money on your API costs and join our enterprise Windmill
                workspace
              </div>
              <a
                className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150"
                href="#0"
              >
                Purchase Plan
              </a>
            </div>
            <ul className="text-slate-600 dark:text-slate-400 text-sm space-y-3 grow">
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>The Free plan plus:</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>
                  Unlimited workflow executions on APIs requiring secrets
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>
                  Join our bluewind enterprise workspace on Windmill (value:
                  $840/mo)
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>
                  Get access to the API we bought at the price we bought them
                  for
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pricing tab 3 */}
        <div className="h-full dark">
          <div className="relative flex flex-col h-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 shadow shadow-slate-950/5">
            <div className="absolute top-0 right-0 mr-6 -mt-4">
              <div className="inline-flex items-center text-xs font-semibold py-1.5 px-3 bg-emerald-500 text-white rounded-full shadow-sm shadow-slate-950/5">
                Most Popular
              </div>
            </div>
            <div className="mb-5">
              <div className="text-slate-900 dark:text-slate-200 font-semibold mb-1">
                Pro
              </div>
              <div className="inline-flex items-baseline mb-2">
                <span className="text-slate-900 dark:text-slate-200 font-bold text-3xl">
                  $
                </span>
                <span className="text-slate-900 dark:text-slate-200 font-bold text-4xl">
                  {isAnnual ? 167 : 199}
                </span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <div className="text-sm text-slate-500 mb-5">
                Join the professional community and grow your visibility +
                network
              </div>
              <a
                className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150"
                href="#0"
              >
                Purchase Plan
              </a>
            </div>
            <ul className="text-slate-600 dark:text-slate-400 text-sm space-y-3 grow">
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>The Starter plan plus:</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>
                  Speaker access to the daily community office hours at 12PM EST
                  time
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>Sponsor status on github</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>Access to the bluewind newsletter</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>Prioritize the roadmap</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>Access to the Pro discord channel</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>Free outreach campaigns to grow your business</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pricing tab 4 */}
        <div className="h-full">
          <div className="relative flex flex-col h-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 shadow shadow-slate-950/5">
            <div className="mb-5">
              <div className="text-slate-900 dark:text-slate-200 font-semibold mb-1">
                Enterprise
              </div>
              <div className="inline-flex items-baseline mb-2">
                <span className="text-slate-900 dark:text-slate-200 font-bold text-3xl">
                  $
                </span>
                <span className="text-slate-900 dark:text-slate-200 font-bold text-4xl">
                  {isAnnual ? '7,500' : '7,500'}
                </span>
                <span className="text-slate-500 font-medium">/year</span>
              </div>
              <div className="text-sm text-slate-500 mb-5">
                Consulting services for companies seeking expert advice.
              </div>
              <a
                className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150"
                href="#0"
              >
                Purchase Plan
              </a>
            </div>
            <ul className="text-slate-600 dark:text-slate-400 text-sm space-y-3 grow">
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>The Pro plan plus:</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>30mns weekly 1/1 calls</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>
                  White glove integration of Windmill into your GTM engine
                </span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>Post your jobs in the bluewind newsletter</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-3 h-3 fill-emerald-500 mr-3 shrink-0"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
                <span>Github Enterprise sponsor</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
