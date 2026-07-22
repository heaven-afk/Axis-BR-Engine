import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-2">
            Axis Engine
          </p>
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="text-sm text-muted mt-1">
            Start your analyst workspace today
          </p>
        </div>
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#3cbeba",
              colorBackground: "#0d1117",
            },
            elements: {
              card: "bg-[#12161d] border border-[rgba(52,62,76,0.7)] shadow-[0_0_40px_rgba(60,190,170,0.06)] rounded-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton:
                "border-[rgba(52,62,76,0.8)] bg-[#0b0f14] text-[#eef2f7] hover:bg-[#161b24]",
              formFieldInput:
                "bg-[#0b0f14] border-[rgba(52,62,76,0.8)] text-[#eef2f7] focus:border-[#3cbeba]",
              formButtonPrimary:
                "bg-[#3cbeba] hover:bg-[#32a9a9] text-black font-bold",
              footerActionLink: "text-[#3cbeba]",
            },
          }}
        />
        <p className="text-center text-[10px] text-muted mt-6">
          Powered by Axis Stat Engine · Built on Nova Technologies
        </p>
      </div>
    </main>
  );
}
