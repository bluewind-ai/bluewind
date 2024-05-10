import React from 'react';

const FaqItem = ({ question, answer }) => (
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
        <span className="text-lg text-blue-600 font-bold">{question}</span>
      </div>
      <div className="flex items-center py-2">
        <span className="text-gray-500">{answer}</span>
      </div>
    </div>
  </div>
);

const FAQSection = () => (
  <div>
    <div className="bg-white p-4 rounded-lg shadow-xl py-8 mt-12">
      <h4 className="text-4xl font-bold text-gray-800 tracking-widest uppercase text-center">
        FAQ
      </h4>
      <p className="text-center text-gray-600 text-sm mt-2">
        Here are some of the frequently asked questions
      </p>
      <div className="space-y-12 px-2 xl:px-16 mt-12">
        <FaqItem
          question="What is Windmill?"
          answer="Windmill is the low-code automation platform we use to build all of our automations. It's an open-source project under the AGPL license."
        />
        <FaqItem
          question="Why some automations cost money to run?"
          answer="Some automations require external APIs to run, which cost money. You need a starter or pro plan to run these automations. Or you can get your own Windmill instance and buy API credits from each individual provider."
        />
        <FaqItem
          question="What's the difference between the Starter and the Pro plan?"
          answer="Both of these plans give you an enterprise Windmill instance hosted in the Bluewind workspace and a selection of dozens of APIs bought for you."
        />
        <FaqItem
          question="If I use the Starter or the Pro plan, do I need to pay for API consumption?"
          answer="Yes. The benefit is that we bought these credits for you at a discount and resell them to you without making margins. You can also plug your own API keys."
        />
      </div>
    </div>
  </div>
);

export default FAQSection;
