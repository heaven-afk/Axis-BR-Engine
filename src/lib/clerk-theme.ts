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
    card: "bg-[#151A1F] border border-[#2A3138] shadow-[0_0_40px_rgba(255,94,26,0.08)] rounded-xl p-6 text-[#E8EAED]",
    headerTitle: "text-[#E8EAED] font-bold text-xl font-display",
    headerSubtitle: "text-[#9AA5B1] text-xs font-mono mt-0.5",
    
    // User Profile & Account Settings Modal Elements
    userProfile: "bg-[#151A1F] text-[#E8EAED] border border-[#2A3138] rounded-2xl shadow-2xl overflow-hidden",
    navbar: "bg-[#0B0E11] border-r border-[#2A3138] p-4",
    navbarTitle: "text-[#9AA5B1] font-mono text-[11px] font-bold uppercase tracking-wider mb-2",
    navbarButton: "text-[#9AA5B1] hover:text-[#E8EAED] hover:bg-[#1D2329] rounded-lg transition-all text-xs font-medium px-3 py-2",
    navbarButtonActive: "bg-[#1D2329] text-[#FF5E1A] font-bold border-l-2 border-[#FF5E1A]",
    navbarButtonIcon: "text-[#9AA5B1]",
    
    profilePage: "bg-[#151A1F] text-[#E8EAED] p-6",
    profileSection: "border-b border-[#2A3138]/60 pb-6 mb-6",
    profileSectionTitle: "text-[#E8EAED] font-bold text-sm tracking-wide border-b border-[#2A3138]/40 pb-2 mb-3",
    profileSectionTitleText: "text-[#E8EAED] font-bold text-sm",
    profileSectionSubtitleText: "text-[#9AA5B1] text-xs",
    profileSectionContent: "text-[#E8EAED] font-medium text-xs",
    profileSectionPrimaryButton: "text-[#FF5E1A] hover:text-[#FF7A3D] font-bold text-xs hover:underline",
    
    userPreviewMainIdentifier: "text-[#E8EAED] font-bold text-sm",
    userPreviewSecondaryIdentifier: "text-[#9AA5B1] text-xs",
    modalCloseButton: "text-[#9AA5B1] hover:text-[#E8EAED] hover:bg-[#1D2329] rounded-full p-2 transition-colors",
    badge: "bg-[#FF5E1A]/10 text-[#FF5E1A] border border-[#FF5E1A]/30 font-mono text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5",
    accordionTriggerButton: "text-[#E8EAED] hover:text-[#FF5E1A] transition-colors",
    
    // Auth Form & Social Buttons
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
    
    // User Button Popover
    userButtonPopoverCard: "bg-[#151A1F] border border-[#2A3138] shadow-2xl rounded-xl text-[#E8EAED]",
    userButtonPopoverActionButton: "hover:bg-[#1D2329] text-[#E8EAED]",
    userButtonPopoverActionButtonText: "text-[#E8EAED]",
    userButtonPopoverFooter: "border-t border-[#2A3138]",
  },
};
