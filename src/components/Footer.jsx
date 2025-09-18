import { FaReact } from 'react-icons/fa';
import { SiVite, SiSupabase, SiNodedotjs } from 'react-icons/si';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="pt-4 text-sm text-stone-700 pb-20">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
            <div>
              <p className="font-semibold">&copy; {currentYear} Fleetly</p>
              <p>All rights reserved.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold">Made by</p>
                <a
                  href="https://brunfjell.github.io/brunfjell-portfolio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <img 
                    src="/fleetly-website/BrunLogo-bwbg.png" 
                    alt="Brunfjell Logo" 
                    className="h-6 w-6 object-contain"
                  />
                  <p className='font-bold font-sans text-lg'>BRUNFJELL</p>
                </a>
              </div>
              <div>
                <p className="font-bold">Made with</p>
                <div className="flex items-center gap-2">
                  <FaReact className="h-6 w-6 text-stone-700" />
                  <SiVite className="h-6 w-6 text-stone-700" />
                  <SiNodedotjs className="h-6 w-6 text-stone-700" />
                  <SiSupabase className="h-6 w-6 text-stone-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
