import { CheckCircle, Lock, CreditCard } from "react-feather";

export default function Features() {
  return (
    <div className="flex flex-col xl:flex-row justify-end">
      <div className="hidden xl:block xl:absolute left-0 bottom-0 w-full">
        <img src="/assets/image/feature-img.png" alt="Feature img" />
      </div>
      <div>
        <h1 className="font-semibold text-gray-900 text-xl md:text-4xl text-center leading-normal mb-6">
          Choice of various types of <br /> house
        </h1>
        <p className="font-normal text-gray-400 text-md md:text-xl text-center mb-16">
          We provide a wide of selection of home types for you and your <br />
          family and are free to choose a home model
        </p>
        <div className="flex flex-col md:flex-row justify-center xl:justify-start space-x-4 mb-20">
          <div className="px-8 h-20 mx-auto md:mx-0 bg-gray-200 rounded-lg flex items-center justify-center mb-5 md:mb-0">
            <CheckCircle className="text-green-900" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-gray-900 text-2xl mb-2">Best Home Guarantee</h4>
            <p className="font-normal text-gray-400 text-xl leading-relaxed">
              We guarantees the quality of your home you bought <br /> from D’house
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-center xl:justify-start space-x-4 mb-20">
          <div className="px-8 h-20 mx-auto md:mx-0 bg-gray-200 rounded-lg flex items-center justify-center mb-5 md:mb-0">
            <Lock className="text-green-900" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-gray-900 text-2xl mb-2">Safe Transaction</h4>
            <p className="font-normal text-gray-400 text-xl leading-relaxed">
              Your transactions will always be kept confidential <br /> and will get discounted
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-center xl:justify-start space-x-4">
          <div className="px-8 h-20 mx-auto md:mx-0 bg-gray-200 rounded-lg flex items-center justify-center mb-5 md:mb-0">
            <CreditCard className="text-green-900" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-gray-900 text-2xl mb-2">Low and Cost Home Taxes</h4>
            <p className="font-normal text-gray-400 text-xl leading-relaxed">
              By buying a house from D’house, you will get a tax <br /> discount
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}