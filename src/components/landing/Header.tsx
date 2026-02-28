import { motion } from "framer-motion";

export function Header() {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      className="fixed top-6 left-4 right-4 md:left-12 md:right-12 lg:left-[1.5in] lg:right-[1.5in] z-50 rounded-full bg-white/[0.03] backdrop-blur-[12px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex items-center justify-between px-6 py-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5e6ad2] to-purple-500 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-base">U</span>
        </div>
        <span className="text-white font-semibold text-xl tracking-wide">UNIFY</span>
      </div>

      <nav className="hidden md:flex items-center gap-20 text-base font-medium text-neutral-300">
        <a href="#platform" className="hover:text-white transition-colors">Platform</a>
        <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
        <a href="#resources" className="hover:text-white transition-colors">Resources</a>
        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
      </nav>

      <div className="flex items-center gap-6">
        <button className="hidden sm:block text-base font-medium text-neutral-300 hover:text-white transition-colors">
          Sign In
        </button>
        <button className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-base font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          Get Started
        </button>
      </div>
    </motion.header>
  );
}
