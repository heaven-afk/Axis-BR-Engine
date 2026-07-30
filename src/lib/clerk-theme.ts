import { dark } from "@clerk/themes";

export const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#FF5E1A",
    colorBackground: "#151A1F",
    colorSurface: "#1D2329",
    colorText: "#E8EAED",
    colorTextSecondary: "#9AA5B1",
    colorInputBackground: "#0B0E11",
    colorInputText: "#FFFFFF",
    colorTextOnPrimaryBackground: "#FFFFFF",
    colorDanger: "#FF3B4E",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-inter), sans-serif",
  },
  elements: {
    card: "bg-[#151A1F] border border-[#2A3138] shadow-[0_0_40px_rgba(255,94,26,0.08)] rounded-xl p-6",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "bg-[#1D2329] border border-[#2A3138] text-[#E8EAED] hover:bg-[#252D38] hover:border-[#3D4752] transition-all duration-200 shadow-sm font-medium",
    socialButtonsIconButton:
      "bg-[#1D2329] border border-[#2A3138] text-[#E8EAED] hover:bg-[#252D38] hover:border-[#3D4752] transition-all duration-200",
    socialButtonsBlockButtonText: "text-[#E8EAED] font-medium text-xs",
    socialButtonsProviderIcon: "filter contrast-125 brightness-110",
    dividerLine: "bg-[#2A3138]",
    dividerText: "text-[#9AA5B1] font-mono text-[11px] uppercase tracking-widest bg-[#151A1F] px-3",
    formFieldLabel: "text-[#E8EAED] font-semibold text-xs tracking-wider uppercase font-mono mb-1.5 block",
    formFieldInput:
      "bg-[#0B0E11] border border-[#2A3138] text-[#FFFFFF] placeholder-[#64748B] text-sm rounded-lg focus:border-[#FF5E1A] focus:ring-1 focus:ring-[#FF5E1A] transition-all duration-200",
    formFieldInputShowPasswordButton: "text-[#9AA5B1] hover:text-[#FFFFFF] transition-colors",
    formButtonPrimary:
      "bg-[#FF5E1A] hover:bg-[#E04E0C] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#FF5E1A]/20 py-2.5 rounded-lg transition-all duration-200 active:scale-[0.99]",
    footerActionText: "text-[#9AA5B1] text-xs font-mono",
    footerActionLink: "text-[#FF5E1A] hover:text-[#FF7A3D] font-bold underline-offset-4 hover:underline transition-all text-xs",
    identityPreviewText: "text-[#E8EAED] font-medium",
    identityPreviewEditButtonIcon: "text-[#FF5E1A]",
    devModeBadge: "bg-[#FF5E1A]/10 text-[#FF5E1A] border border-[#FF5E1A]/30 font-mono text-[10px] font-semibold uppercase tracking-wider rounded px-2 py-0.5",
    userButtonPopoverCard: "bg-[#151A1F] border border-[#2A3138] shadow-2xl rounded-xl",
    userButtonPopoverActionButton: "hover:bg-[#1D2329] text-[#E8EAED]",
    userButtonPopoverActionButtonText: "text-[#E8EAED]",
    userButtonPopoverFooter: "border-t border-[#2A3138]",
  },
};
