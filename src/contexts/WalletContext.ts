// Compatibility shim: some modules import from "@/contexts/WalletContext"
// while the canonical file lives at "@/context/WalletContext".
import { WalletProvider } from "@/context/WalletContext";

export * from "@/context/WalletContext";
export default WalletProvider;
