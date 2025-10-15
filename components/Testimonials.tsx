import { Star } from "react-feather";

export default function Testimonials() {
  return (
    <div className="container max-w-screen-xl mx-auto px-4 xl:relative">
      <p className="font-normal text-gray-400 text-lg md:text-xl text-center uppercase mb-6">Testimonial</p>
      <h1 className="font-semibold text-gray-900 text-2xl md:text-4xl text-center leading-normal mb-14">
        What People Say <br /> About D’house
      </h1>
      <div className="hidden xl:block xl:absolute top-0">
        <img src="/assets/image/testimoni-1.png" alt="Image" />
      </div>
      <div className="hidden xl:block xl:absolute top-32">
        <img src="/assets/image/testimoni-2.png" alt="Image" />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-center md:space-x-8 lg:space-x-12 mb-10 md:mb-20">
        {/* Testimonial 1 */}
        <div className="bg-gray-100 rounded-lg mb-10 md:mb-0">
          <img src="/assets/image/testimoni-3.png" alt="Image" className="mx-8 my-8" />
          <div className="flex items-center gap-5 mx-8">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Star key={i} className="text-yellow-500" />
              ))}
          </div>
          <p className="font-normal text-sm lg:text-md text-gray-400 mx-8 my-8">
            I recommend anyone to buy house on <br />
            D’house. I received great customer service <br />
            from the specialists who helped me.
          </p>
          <h3 className="font-semibold text-gray-900 text-xl md:text-2xl lg:text-3xl mx-8 mb-8">Brooklyn Simmons</h3>
        </div>
        {/* Testimonial 2 */}
        <div className="bg-gray-100 rounded-lg">
          <img src="/assets/image/testimoni-4.png" alt="Image" className="mx-8 my-8" />
          <div className="flex items-center gap-5 mx-8">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Star key={i} className="text-yellow-500" />
              ))}
          </div>
          <p className="font-normal text-sm lg:text-md text-gray-400 mx-8 my-8">
            D’house is the best property agent in the <br />
            world. I received great customer service <br />
            from the D’house agent
          </p>
          <h3 className="font-semibold text-gray-900 text-xl md:text-2xl lg:text-3xl mx-8 mb-8">Ralph Edwards</h3>
        </div>
      </div>
    </div>
  );
}