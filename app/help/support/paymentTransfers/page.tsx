"use client";
import { ArrowLeft, Search, Send, Wallet, ArrowUpDown, Plus, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import Link from "next/link";
import SupportTabs from "@/components/common/support-tabs";

export default function PaymentTransfers() {
  const [activeTab, setActiveTab] = useState("Client FAQ");

  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 flex flex-col gap-4 md:gap-6">
        <Link
          href="/help/support"
          className="inline-flex items-center gap-1.5 text-sm text-[#A0A0A0] hover:text-white transition-colors w-fit"
          aria-label="Back to Help Center"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Help Center</span>
        </Link>

        <SupportTabs activeTab={activeTab} setActiveTab={setActiveTab}>
          <div className="min-h-screen flex">
            <Tabs
              defaultValue="sending-payments"
              orientation="vertical"
              className="flex w-full"
            >
              <div className="flex gap-6 md:flex-row flex-col flex-1">
                <div className="md:max-w-80 w-full rounded-md border border-[#2D2D2D] bg-[#0f0711] text-white flex flex-col">
                  <div className="px-4 pt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search"
                        className="bg-black rounded-md border-[#2D333E] text-white placeholder-gray-400 pl-10 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  <TabsList className="bg-transparent h-auto flex-col w-full space-y-1 p-4 justify-start">
                    <TabsTrigger
                      value="sending-payments"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white hover:text-black data-[state=active]:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Sending Payments
                    </TabsTrigger>
                    <TabsTrigger
                      value="receiving-payments"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Receiving Payments
                    </TabsTrigger>
                    <TabsTrigger
                      value="wallet-management"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Wallet Management
                    </TabsTrigger>
                    <TabsTrigger
                      value="cross-border"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Cross-Border Transfers
                    </TabsTrigger>
                    <TabsTrigger
                      value="payment-methods"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white data-[state=active]:text-black hover:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Payment Methods
                    </TabsTrigger>
                    <TabsTrigger
                      value="transfer-limits"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white data-[state=active]:text-black hover:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Transfer Limits
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex border w-full rounded-md border-[#2D2D2D] bg-[#0f0711] overflow-y-auto">
                  <TabsContent
                    value="sending-payments"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Sending Payments
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            How to Send Payments on Stellopay
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            Sending money with Stellopay is fast, secure, and
                            affordable. Follow these steps to send payments to
                            friends, family, or businesses.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Sending a Payment:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                Log in to your Stellopay account and navigate to
                                the &quot;Send&quot; section.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                Enter the recipient&apos;s Stellar address,
                                email, or phone number.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                Enter the amount and select the currency you
                                wish to send.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">4.</span>
                              <span>
                                Review the transaction details, including any
                                network fees.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">5.</span>
                              <span>
                                Confirm the payment and enter your 2FA code if
                                enabled.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div className="flex items-start text-[#E5E5E5] bg-[#1A1A2E] p-4 rounded-md">
                          <Send className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            Most Stellopay transactions settle on the Stellar
                            network in 3-5 seconds, making it one of the fastest
                            payment platforms available.
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Still Need Help?
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed">
                            Having trouble sending a payment? Contact Stellopay
                            Support at support@stellopay.com for assistance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="receiving-payments"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Receiving Payments
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            How to Receive Payments on Stellopay
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            Receiving money with Stellopay is seamless. Share
                            your Stellar address or payment link with anyone to
                            start receiving funds instantly.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Ways to Receive Payments:
                          </h3>
                          <div className="space-y-4 text-sm text-[#E5E5E5]">
                            <div className="flex items-start">
                              <Wallet className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Stellar Address:</strong> Share your
                                unique Stellar wallet address with the sender.
                                Funds arrive in seconds.
                              </span>
                            </div>
                            <div className="flex items-start">
                              <ArrowUpDown className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Payment Links:</strong> Generate a
                                payment link with a specific amount and share it
                                via email, text, or social media.
                              </span>
                            </div>
                            <div className="flex items-start">
                              <Plus className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Invoice Requests:</strong> Send an
                                invoice to a client or customer for payment.
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Checking Received Payments:
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed">
                            All received payments appear in your transaction
                            history immediately. You&apos;ll also receive a
                            notification and email confirmation for each
                            incoming payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="wallet-management"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Wallet Management
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            Managing Your Stellopay Wallet
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            Your Stellopay wallet is your gateway to the Stellar
                            network. Learn how to manage your balances, add
                            assets, and keep your wallet organized.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Wallet Features:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                <strong>Multi-Asset Support:</strong> Hold and
                                manage multiple assets in a single wallet.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                <strong>Balance Tracking:</strong> View your
                                real-time balances for all assets.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                <strong>Transaction History:</strong> Access a
                                complete history of all wallet activity.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">4.</span>
                              <span>
                                <strong>Trustlines:</strong> Add trustlines to
                                hold and trade supported assets.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Still Need Help?
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed">
                            For wallet-related issues, contact Stellopay Support
                            at support@stellopay.com.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="cross-border"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Cross-Border Transfers
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            Send Money Across Borders Instantly
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            Stellopay makes international money transfers fast,
                            affordable, and transparent with competitive
                            exchange rates and low fees.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            How Cross-Border Transfers Work:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                Select the &quot;International Transfer&quot;
                                option from the Send menu.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                Choose the destination country and currency.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                Enter the amount and review the exchange rate
                                and fees.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">4.</span>
                              <span>
                                Confirm and complete the transfer. Funds arrive
                                in seconds.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div className="flex items-start text-[#E5E5E5] bg-[#1A1A2E] p-4 rounded-md">
                          <Globe className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            Stellopay supports transfers to over 180 countries
                            with competitive exchange rates and no hidden fees.
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="payment-methods"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Payment Methods content coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="transfer-limits"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Transfer Limits content coming soon
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>

            <style jsx>{`
              @media (max-width: 768px) {
                .min-h-screen > div {
                  flex-direction: column;
                }
                .w-80 {
                  width: 100%;
                  height: auto;
                }
              }
            `}</style>
          </div>
        </SupportTabs>
      </div>
    </>
  );
}
