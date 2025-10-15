import { useState } from "react";
import { Menu } from "react-feather";

const navLinks = [
  { name: "Landing", href: "#" },
  { name: "Pages", href: "#" },
  { name: "Contact", href: "#" },
  { name: "About", href: "#" },
];

export default function Navbar() {
  const [navbarOpen, setNavbarOpen] = useState(false);

  return (
    <nav className="flex-wrap lg:flex items-center py-14 xl:relative z-10">
      <div className="flex items-center justify-between mb-10 lg:mb-0">
        <img src="/assets/image/navbar-logo.png" alt="Logo img" className="w-52 md:w-80 lg:w-full" />
        <button
          className="lg:hidden w-10 h-10 ml-auto flex items-center justify-center text-green-700 border border-green-700 rounded-md"
          onClick={() => setNavbarOpen((v) => !v)}
        >
          <Menu />
        </button>
      </div>
      <ul
        className={`lg:flex flex-col lg:flex-row lg:items-center lg:mx-auto lg:space-x-8 xl:space-x-16 ${
          navbarOpen ? "flex" : "hidden"
        }`}
      >
        {navLinks.map((link) => (
          <li
            key={link.name}
            className="font-semibold text-gray-900 text-lg hover:text-gray-400 transition ease-in-out duration-300 mb-5 lg:mb-0"
          >
            <a href={link.href}>{link.name}</a>
          </li>
        ))}
      </ul>
      <button
        className={`px-5 py-3 lg:block border-2 border-green-700 rounded-lg font-semibold text-green-700 text-lg hover:bg-green-700 hover:text-white transition ease-linear duration-500 ${
          navbarOpen ? "flex" : "hidden"
        }`}
      >
        Request quote
      </button>
    </nav>
  );
}