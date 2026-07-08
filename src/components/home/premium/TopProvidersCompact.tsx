import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const providers = [
  { id: "pp",  name: "Pragmatic", grad: "from-amber-400 to-orange-600" },
  { id: "ev",  name: "Evolution", grad: "from-slate-200 to-slate-400" },
  { id: "pg",  name: "PG Soft",   grad: "from-fuchsia-400 to-purple-600" },
  { id: "hk",  name: "Hacksaw",   grad: "from-rose-400 to-red-600" },
  { id: "sp",  name: "Spribe",    grad: "from-cyan-300 to-blue-600" },
  { id: "more",name: "More",      grad: "from-emerald-300 to-teal-600" },
];

export default function TopProvidersCompact() {
  const navigate = useNavigate();
  return (
    <div className="rounded-3xl gl-glass border border-white/8 p-3 md:p-4 h-full">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12px] font-black gl-text">Top Providers</span>
        <button type="button" onClick={() => navigate("/popular")}
          className="clickable text-[10px] font-bold gl-gold-text">View All →</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {providers.map((p, i) => (
          <motion.button key={p.id} type="button"
            onClick={() => navigate("/popular")}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
            className="clickable rounded-2xl px-3 py-3 bg-[#04111F]/60 border border-white/8 flex items-center justify-center"
          >
            <span className={`text-[12px] font-black bg-gradient-to-r ${p.grad} bg-clip-text text-transparent tracking-tight`}>
              {p.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
