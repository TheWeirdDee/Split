import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ShieldCheck, Users, Wallet, Wrench, Zap } from "lucide-react";

const FAQ_SECTIONS = [
  {
    title: "Getting Started",
    description: "Basics for first-time users.",
    icon: HelpCircle,
    items: [
      {
        question: "What is Split?",
        answer:
          "Split is a group expense app that helps friends track shared spending and settle debts instantly with usdm on Celo.",
      },
      {
        question: "Do I need to create a username and password?",
        answer:
          "No. Your wallet address is your identity. You can optionally set a display name in Settings.",
      },
      {
        question: "Can I use Split without MiniPay?",
        answer:
          "Yes. You can also connect with a supported injected wallet on desktop/mobile browser. MiniPay users get the smoothest flow.",
      },
      {
        question: "Does Split hold my money?",
        answer:
          "No. Split does not custody your funds. Settlements are wallet-to-wallet usdm transfers.",
      },
      {
        question: "Is Split free to use?",
        answer:
          "Creating groups and tracking expenses is free in-app. On-chain settlement transactions still require network fees.",
      },
    ],
  },
  {
    title: "Wallet and Payments",
    description: "How money movement works.",
    icon: Wallet,
    items: [
      {
        question: "Which currency does Split use for settlement?",
        answer:
          "Split settles in usdm on Celo Mainnet.",
      },
      {
        question: "Why do I see an approval step before settling?",
        answer:
          "ERC-20 tokens require an approval transaction so the contract can transfer the exact amount for settlement.",
      },
      {
        question: "What if my payment transaction fails?",
        answer:
          "No settlement is recorded unless the chain transaction is confirmed. Check your wallet balance, network, and retry.",
      },
      {
        question: "Can I verify transactions on-chain?",
        answer:
          "Yes. Activity entries with transaction hashes can be opened on Celoscan.",
      },
      {
        question: "Can I make partial payments?",
        answer:
          "Today, settlement is actioned per debt row amount shown in the app. Custom partial settlement is not exposed yet.",
      },
    ],
  },
  {
    title: "Groups and Expenses",
    description: "Managing members and shared costs.",
    icon: Users,
    items: [
      {
        question: "How are expense shares calculated?",
        answer:
          "Each expense is split equally among selected participants in the current version.",
      },
      {
        question: "Can I choose who paid for an expense?",
        answer:
          "Yes. In Add Expense, select the payer from group members before submitting.",
      },
      {
        question: "Can I add members manually?",
        answer:
          "Yes. In a group, use \"Add Member by Address\" and optionally assign a display name.",
      },
      {
        question: "Can I delete a group?",
        answer:
          "Yes, if you are the creator and there are no unsettled balances remaining in that group.",
      },
      {
        question: "Can I edit or delete an expense after posting?",
        answer:
          "Editing/deleting full expenses is not fully exposed in the current UX. Activity rows support limited deletions for some records.",
      },
    ],
  },
  {
    title: "Notifications and Activity",
    description: "Staying updated across groups.",
    icon: Zap,
    items: [
      {
        question: "What notifications can I receive?",
        answer:
          "You can receive reminders, new expense alerts, group join updates, settlement notifications, and group chat updates.",
      },
      {
        question: "Where do I see notification count?",
        answer:
          "Use the bell icon in the top app header. The badge shows your unread count.",
      },
      {
        question: "How do I mark notifications as read?",
        answer:
          "Open Notifications and tap individual items, or use \"Mark all read.\"",
      },
      {
        question: "Why am I not seeing new notifications?",
        answer:
          "Check that you are connected with the expected wallet address and refresh the app. Notifications are address-specific.",
      },
      {
        question: "What is the difference between Notifications and Activity?",
        answer:
          "Notifications are action prompts and updates sent to you. Activity is your event history (expenses, settlements, group actions).",
      },
    ],
  },
  {
    title: "Security and Privacy",
    description: "What is public, private, and stored.",
    icon: ShieldCheck,
    items: [
      {
        question: "Is my private key ever shared with Split?",
        answer:
          "No. Signing happens in your wallet. Split only receives signed transaction results and app data.",
      },
      {
        question: "What data is on-chain vs off-chain?",
        answer:
          "Settlement and group/expense contract calls are on-chain. App metadata like descriptions, member labels, and chat data are stored in Supabase.",
      },
      {
        question: "Can anyone access my group link?",
        answer:
          "Anyone with the invite link can attempt to join. Share links only with trusted members.",
      },
      {
        question: "Does Split use HTTPS and secure providers?",
        answer:
          "Yes, the app uses secure RPC and Supabase endpoints over HTTPS.",
      },
      {
        question: "Can I remove my information?",
        answer:
          "You can disconnect your wallet and remove some records through in-app actions. Full account/data tooling is a future UX improvement.",
      },
    ],
  },
  {
    title: "Troubleshooting",
    description: "Fix common issues quickly.",
    icon: Wrench,
    items: [
      {
        question: "Wallet won't connect. What should I do?",
        answer:
          "Confirm your wallet extension/app is installed and unlocked, then reconnect. On desktop, refresh after granting permissions.",
      },
      {
        question: "I'm on the wrong network.",
        answer:
          "Switch to Celo Mainnet in your wallet. The app also attempts network switching for supported wallets.",
      },
      {
        question: "My usdm balance looks outdated.",
        answer:
          "Balances refresh periodically and after major actions. Pull-to-refresh or reload the page to force a fresh read.",
      },
      {
        question: "Invite link opens but group does not load.",
        answer:
          "Ask the sender to resend the link and verify the full URL. Also confirm your wallet is connected before joining.",
      },
      {
        question: "Who do I contact for support?",
        answer:
          "Use your project support channel/repo issues. Include wallet address, group ID, and transaction hash when reporting bugs.",
      },
    ],
  },
];

export const metadata: Metadata = {
  title: "Split FAQ",
  description: "Frequently asked questions about using Split with usdm on Celo.",
};

/** FAQ page (route `/faq`) answering common questions about Split. */
export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F7F3EC]">
      <main className="mx-auto w-full max-w-[980px] px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#8A8A8A] transition-colors hover:text-[#F7F3EC]"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <section className="mt-6 rounded-3xl border border-[#2C2C2C] bg-[#111111] p-6 sm:p-8">
          <p className="dm-mono text-[11px] uppercase tracking-[0.16em] text-[#00C896]">Help Center</p>
          <h1 className="clash-display mt-3 text-3xl font-bold sm:text-5xl">Frequently Asked Questions</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#8A8A8A] sm:text-base">
            Everything users usually ask about Split: setup, wallet behavior, expenses, settlements,
            notifications, privacy, and troubleshooting.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="rounded-xl bg-[#00C896] px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#00b082]"
            >
              Open App
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#2C2C2C] px-5 py-3 text-sm font-semibold text-[#8A8A8A] transition-colors hover:border-[#3A3A3A] hover:text-[#F7F3EC]"
            >
              Explore Landing Page
            </Link>
          </div>
        </section>

        <div className="mt-8 space-y-6 sm:mt-10">
          {FAQ_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title} className="rounded-2xl border border-[#222222] bg-[#0F0F0F] p-4 sm:p-6">
                <div className="mb-4 flex items-start gap-3 sm:mb-5">
                  <div className="mt-0.5 rounded-xl border border-[#2C2C2C] bg-[#161616] p-2 text-[#00C896]">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h2 className="clash-display text-xl font-semibold sm:text-2xl">{section.title}</h2>
                    <p className="mt-1 text-sm text-[#8A8A8A]">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {section.items.map((item) => (
                    <details key={item.question} className="rounded-xl border border-[#242424] bg-[#141414] p-4">
                      <summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-[#F7F3EC] sm:text-base">
                        {item.question}
                      </summary>
                      <p className="mt-3 text-sm leading-7 text-[#9A9A9A]">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
