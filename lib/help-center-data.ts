export interface HelpTopic {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  keywords: string[];
  hasSubPage: boolean;
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "account-management",
    title: "Account Management",
    subtitle:
      "Update your profile, reset your password, and manage your account settings",
    link: "/help/support/accountManagement",
    keywords: ["profile", "password", "settings", "login", "verification", "deactivation"],
    hasSubPage: true,
  },
  {
    id: "transaction-issues",
    title: "Transaction Issues",
    subtitle:
      "Resolve payment failures, track transactions, and dispute unauthorized charges",
    link: "/help/support/transactionIssues",
    keywords: ["payment", "failed", "error", "dispute", "refund", "chargeback"],
    hasSubPage: false,
  },
  {
    id: "security-privacy",
    title: "Security & Privacy",
    subtitle:
      "Keep your account safe with 2FA, fraud prevention, and privacy controls",
    link: "/help/support/securityPrivacy",
    keywords: ["2fa", "fraud", "privacy", "hack", "secure", "authentication"],
    hasSubPage: false,
  },
  {
    id: "payment-transfers",
    title: "Payment & Transfers",
    subtitle:
      "Learn how to send, receive, and manage payments securely and efficiently",
    link: "/help/support/paymentTransfers",
    keywords: ["send", "receive", "transfer", "money", "withdraw", "deposit"],
    hasSubPage: false,
  },
  {
    id: "billing-invoices",
    title: "Billing & Invoices",
    subtitle:
      "View your billing history, download invoices, and manage payment methods",
    link: "/help/support/paymentTransfers",
    keywords: ["invoice", "bill", "receipt", "payment method", "card"],
    hasSubPage: false,
  },
  {
    id: "notifications-alerts",
    title: "Notifications & Alerts",
    subtitle:
      "Configure your notification preferences and manage alert settings",
    link: "/help/support/accountManagement",
    keywords: ["alert", "notification", "email", "sms", "push"],
    hasSubPage: false,
  },
];

export function filterTopics(query: string): HelpTopic[] {
  if (!query.trim()) return HELP_TOPICS;
  const q = query.toLowerCase();
  return HELP_TOPICS.filter(
    (topic) =>
      topic.title.toLowerCase().includes(q) ||
      topic.subtitle.toLowerCase().includes(q) ||
      topic.keywords.some((k) => k.toLowerCase().includes(q)),
  );
}
