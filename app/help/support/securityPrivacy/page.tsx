"use client";
import { ArrowLeft, Search, Shield, Lock, Eye, Key, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import Link from "next/link";
import SupportTabs from "@/components/common/support-tabs";

export default function SecurityPrivacy() {
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
              defaultValue="two-factor-auth"
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
                      value="two-factor-auth"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white hover:text-black data-[state=active]:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Two-Factor Authentication
                    </TabsTrigger>
                    <TabsTrigger
                      value="fraud-prevention"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Fraud Prevention
                    </TabsTrigger>
                    <TabsTrigger
                      value="privacy-controls"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Privacy Controls
                    </TabsTrigger>
                    <TabsTrigger
                      value="secure-account"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white text-white hover:text-black data-[state=active]:text-black hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Keeping Your Account Secure
                    </TabsTrigger>
                    <TabsTrigger
                      value="report-suspicious"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white data-[state=active]:text-black hover:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Report Suspicious Activity
                    </TabsTrigger>
                    <TabsTrigger
                      value="data-protection"
                      className="w-full justify-start bg-transparent data-[state=active]:bg-white data-[state=active]:text-black hover:text-black text-white hover:bg-white py-3 px-4 rounded-md text-left"
                    >
                      Data Protection
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex border w-full rounded-md border-[#2D2D2D] bg-[#0f0711] overflow-y-auto">
                  <TabsContent
                    value="two-factor-auth"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Two-Factor Authentication (2FA)
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            Enhance Your Account Security with 2FA
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            Two-factor authentication adds an extra layer of
                            security to your Stellopay account, ensuring that
                            only you can access your funds even if your password
                            is compromised.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Setting Up 2FA:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                Go to Settings &gt; Security &gt; Two-Factor
                                Authentication.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                Choose your preferred method: Authenticator App
                                or SMS.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                Scan the QR code with your authenticator app or
                                enter your phone number for SMS.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">4.</span>
                              <span>
                                Enter the verification code to confirm the
                                setup.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">5.</span>
                              <span>
                                Save your backup codes in a secure location for
                                account recovery.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div className="flex items-start text-[#E5E5E5] bg-[#1A1A2E] p-4 rounded-md">
                          <Shield className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            We recommend using an authenticator app like Google
                            Authenticator or Authy for the highest level of
                            security.
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Lost Access to Your 2FA Device?
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed">
                            If you lose access to your authenticator app or
                            phone, use one of your backup recovery codes to
                            regain access. Contact support immediately if you
                            don&apos;t have access to your backup codes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="fraud-prevention"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Fraud Prevention Tips
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            Protecting Yourself from Fraud
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            Stay safe online by following these best practices
                            to protect your Stellopay account from fraudsters
                            and scammers.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Key Safety Tips:
                          </h3>
                          <div className="space-y-4 text-sm text-[#E5E5E5]">
                            <div className="flex items-start">
                              <Lock className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Never share your password</strong> or
                                2FA codes with anyone. Stellopay will never ask
                                for your password via email or phone.
                              </span>
                            </div>
                            <div className="flex items-start">
                              <Eye className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Verify website URLs</strong> before
                                logging in. Always ensure you are on the
                                official Stellopay website.
                              </span>
                            </div>
                            <div className="flex items-start">
                              <Key className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Use strong, unique passwords</strong>{" "}
                                for your Stellopay account. Avoid reusing
                                passwords from other services.
                              </span>
                            </div>
                            <div className="flex items-start">
                              <Bell className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Enable transaction alerts</strong> to
                                receive notifications for all account activity.
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Recognizing Phishing Attempts:
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed">
                            Be cautious of unsolicited emails or messages asking
                            for personal information. Stellopay will never
                            request your password, 2FA codes, or private keys
                            via email, text message, or phone calls.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="privacy-controls"
                    className="mt-0 h-full p-8"
                  >
                    <div className="max-w-4xl">
                      <h1 className="text-2xl font-semibold text-white mb-6">
                        Privacy Controls
                      </h1>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-white">
                            Managing Your Privacy Settings
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            Take control of your personal information and choose
                            what data you share on the Stellopay platform.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Available Privacy Controls:
                          </h3>
                          <ol className="space-y-2 text-sm text-[#E5E5E5]">
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">1.</span>
                              <span>
                                <strong>Profile Visibility:</strong> Choose
                                who can see your transaction history and profile
                                information.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">2.</span>
                              <span>
                                <strong>Data Sharing Preferences:</strong>{" "}
                                Control how your data is used for analytics and
                                improvements.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">3.</span>
                              <span>
                                <strong>Communication Preferences:</strong>{" "}
                                Manage email and notification preferences for
                                marketing and updates.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-semibold mr-2">4.</span>
                              <span>
                                <strong>Account Data Export:</strong> Download
                                a copy of your account data at any time.
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Still Need Help?
                          </h3>
                          <p className="text-[#E5E5E5] text-sm leading-relaxed">
                            For questions about your privacy, contact Stellopay
                            Support at support@stellopay.com.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="secure-account"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Keeping Your Account Secure content coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="report-suspicious"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Report Suspicious Activity content coming soon
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="data-protection"
                    className="mt-0 h-full p-8"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white text-xl">
                        Data Protection content coming soon
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
