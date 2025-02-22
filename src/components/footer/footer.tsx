import { useTheme } from "next-themes"
import useCurrentTheme from "@/hooks/styles/theme"
import Link from "next/link"

const resources = [
  {
    label: "Institutional",
    destination: "/institutional",
  },
  {
    label: "Fee Discounts",
    destination: "/fee-discounts",
  },
  {
    label: "Privacy Policy",
    destination: "/privacy-policy",
  },
]

const support = [
  {
    label: "Liquid Docs",
    destination: "/docs",
  },
  {
    label: "API Documentation",
    destination: "/api-docs",
  },
  {
    label: "Terms & Conditions",
    destination: "/terms",
  },
]

const Footer = () => {
  const { theme, setTheme } = useTheme()
  const currentTheme = useCurrentTheme()

  return (
    <footer className="text-gray-300 relative overflow-hidden bg-[#050B18]">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-cyan-900/20 opacity-50"></div>
      <div className="absolute inset-0 bg-[url('/blockchain-bg.svg')] bg-repeat opacity-10"></div>
      <div className="lg:px-[12vw] mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Logo Section */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={"/logo/gtx-gradient.png"}
                className="h-10"
                alt="GTX Logo"
              />
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                GTX
              </span>
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-center py-5">
              <p className="text-gray-400 text-sm">© 2025 LiquidBook</p>
            </div>
          </div>

          {/* Resources Section */}
          <div className="col-span-1">
            <h2 className="text-cyan-300 font-medium mb-4 text-lg">Resources</h2>
            <ul className="space-y-3">
              {resources.map((item, index) => (
                <li key={index}>
                  <Link href={item.destination} className="text-gray-400 hover:text-cyan-300 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Section */}
          <div className="col-span-1">
            <h2 className="text-cyan-300 font-medium mb-4 text-lg">Support</h2>
            <ul className="space-y-3">
              {support.map((item, index) => (
                <li key={index}>
                  <Link href={item.destination} className="text-gray-400 hover:text-cyan-300 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Section */}
          <div className="col-span-1">
            <h2 className="text-cyan-300 font-medium mb-4 text-lg">Community</h2>
            <div className="flex space-x-4">
              <a
                href="https://discord.gg/liquidbook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/liquidbook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://t.me/liquidbook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Blockchain-inspired decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"></div>
      </div>
    </footer>
  )
}

export default Footer

