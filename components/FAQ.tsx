import React from 'react';

const FAQ = () => {
  return (
    <div className="p-8">
      <div className="bg-white p-4 rounded-lg shadow-xl py-8 mt-12">
        <h4 className="text-4xl font-bold text-gray-800 tracking-widest uppercase text-center">
          FAQ
        </h4>
        <p className="text-center text-gray-600 text-sm mt-2">
          Here are some of the frequently asked questions
        </p>
        <div className="space-y-12 px-2 xl:px-16 mt-12">
          <div className="mt-4 flex">
            <div>
              <div className="flex items-center h-16 border-l-4 border-blue-600">
                <span className="text-4xl text-blue-600 px-4">Q.</span>
              </div>
              <div className="flex items-center h-16 border-l-4 border-gray-400">
                <span className="text-4xl text-gray-400 px-4">A.</span>
              </div>
            </div>
            <div>
              <div className="flex items-center h-16">
                <span className="text-lg text-blue-600 font-bold">
                  What is Windmill?
                </span>
              </div>
              <div className="flex items-center py-2">
                <span className="text-gray-500">
                  Windmill is the low-code automation platform we use to build
                  all of our automations. It's an open-source project under the
                  AGPL license.
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex">
            <div>
              <div className="flex items-center h-16 border-l-4 border-blue-600">
                <span className="text-4xl text-blue-600 px-4">Q.</span>
              </div>
              <div className="flex items-center h-16 border-l-4 border-gray-400">
                <span className="text-4xl text-gray-400 px-4">A.</span>
              </div>
            </div>
            <div>
              <div className="flex items-center h-16">
                <span className="text-lg text-blue-600 font-bold">
                  Why some automations cost money to run?
                </span>
              </div>
              <div className="flex items-center py-2">
                <span className="text-gray-500">
                  Some automations require external apis to run, which cost
                  money. You need a starter or pro plan to run these
                  automations. Or you can get your own windmill instance and buy
                  api credits from each individual providers.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex">
            <div>
              <div className="flex items-center h-16 border-l-4 border-blue-600">
                <span className="text-4xl text-blue-600 px-4">Q.</span>
              </div>
              <div className="flex items-center h-16 border-l-4 border-gray-400">
                <span className="text-4xl text-gray-400 px-4">A.</span>
              </div>
            </div>
            <div>
              <div className="flex items-center h-16">
                <span className="text-lg text-blue-600 font-bold">
                  What&apos;s the difference between the Starter and the Pro
                  plan?
                </span>
              </div>
              <div className="flex items-center py-2">
                <span className="text-gray-500">
                  Both of these plans give you an enterprise windmill instance
                  hosted in the Bluewind workspace and a selection of dozens of
                  APIs bought for you
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex">
            <div>
              <div className="flex items-center h-16 border-l-4 border-blue-600">
                <span className="text-4xl text-blue-600 px-4">Q.</span>
              </div>
              <div className="flex items-center h-16 border-l-4 border-gray-400">
                <span className="text-4xl text-gray-400 px-4">A.</span>
              </div>
            </div>
            <div>
              <div className="flex items-center h-16">
                <span className="text-lg text-blue-600 font-bold">
                  If I use the starter or the pro plan, do I need to pay for API
                  consumption?
                </span>
              </div>
              <div className="flex items-center py-2">
                <span className="text-gray-500">
                  Yes. The benefit is that we bought these credits for you at a
                  discount and resell them to you without making margins. You
                  can also plug your own API keys to the
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
