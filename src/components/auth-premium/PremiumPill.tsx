import { motion } from "framer-motion";

interface Props {
  icon: string;
  label: string;
  delay?: number;
}

const PremiumPill = ({ icon, label, delay = 0 }: Props) => (
  <motion.span
    className="luxe-pill"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.04 }}
  >
    <span aria-hidden>{icon}</span>
    <span>{label}</span>
  </motion.span>
);

export default PremiumPill;
