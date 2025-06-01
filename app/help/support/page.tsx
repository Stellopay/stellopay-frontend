"use client";
import EmailInput from "@/app/components/EmailInput";
import FaqCard from "@/app/components/FaqCard";
import TextareaInput from "@/app/components/TextAreaInput";
import TextInput from "@/app/components/TextInput";
import Button from "@/app/components/Button";
import { CircleHelp, Clock3, ContactRound, Mail, Phone } from "lucide-react";
import React, { useState } from "react";

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState("Client FAQ");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [textarea, setTextarea] = useState<string>("");
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);

  React.useEffect(() => {
    setIsButtonDisabled(!(email && firstName && lastName && textarea));
  }, [firstName, email, lastName, textarea]);

  const handleFirstNameChange = (value: string): void => setFirstName(value);
  const handleLastNameChange = (value: string): void => setLastName(value);
  const handleEmailChange = (value: string): void => setEmail(value);
  const handleTextareaChange = (value: string): void => setTextarea(value);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isButtonDisabled) {
      // Implement submit here
      console.log("Submitted");
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-10 bg-[#230d22] text-white flex flex-col gap-6">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
        Help/Support
      </h1>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row mb-6 sm:mb-8 gap-2 sm:gap-0">
        {["Client FAQ", "Contact Support"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-5 py-2 sm:py-3 border border-[#2d2d2d] cursor-pointer text-sm sm:text-base font-medium transition ${
              activeTab === tab
                ? `bg-white ${
                    activeTab === "Client FAQ"
                      ? "rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                      : "rounded-b-lg sm:rounded-r-lg sm:rounded-bl-none"
                  } text-black shadow`
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Only show FAQ section when "Client FAQ" is active */}
      {activeTab === "Client FAQ" && (
        <div className="w-full bg-[#0D0D0D80] border border-[#2D2D2D] px-4 pt-4 pb-6 rounded-[0.875rem] space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center border border-[#2E2E2E] rounded-[0.5rem] w-[2rem] h-[2rem]">
              <CircleHelp color="#E5E5E5" />
            </div>
            <h3 className="text-base font-normal text-[#E5E5E5]">
              Frequently Asked Questions
            </h3>
          </div>

          {/* FAQ Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <FaqCard
              title="Account Management"
              subtitle="Update your profile, reset your password, and manage your account"
            />
            <FaqCard
              title="Transaction Issues"
              subtitle="Resolve payment failures, track transactions, and dispute unauthorized charges."
            />
            <FaqCard
              title="Security & Privacy"
              subtitle="Keep your account safe with 2FA, fraud prevention, and privacy controls."
            />
            <FaqCard
              title="Payment & Transfers"
              subtitle="Learn how to send, receive, and manage payments securely and efficiently."
            />
            <FaqCard
              title="Payment & Transfers"
              subtitle="Learn how to send, receive, and manage payments securely and efficiently."
            />
            <FaqCard
              title="Account Management"
              subtitle="Update your profile, reset your password, and manage your account."
            />
          </div>
        </div>
      )}

      {activeTab === "Contact Support" && (
        <div className="flex flex-col lg:flex-row w-full bg-[#0D0D0D80] border border-[#2D2D2D] px-6 md:px-10 pt-10 pb-6 rounded-[0.875rem] gap-y-10 lg:space-y-0 lg:gap-x-10">
          {/* Left div */}
          <div className="w-full lg:w-[40%] lg:pr-[7.125rem]">
            <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center border border-[#2E2E2E] rounded-[0.5rem] w-[2rem] h-[2rem]">
                  <ContactRound color="#E5E5E5" />
                </div>
                <h3 className="text-base font-normal text-[#E5E5E5]">
                  Contact Info & FAQ Details
                </h3>
              </div>

              <p className="text-[14px] font-normal text-[#707070] w-[95%] pb-[1.5rem]">
                Need help? Find answers to common questions or reach out to our
                support team for assistance.
              </p>

              <div className="bg-[#707070] w-full h-[0.0625rem]"></div>

              {/* Support Email */}
              <div className="pt-[1.5rem]">
                <h3 className="font-semibold text-[1rem] text-[#FFFFFF]">
                  Support Email:
                </h3>
                <div className="flex gap-1 items-center">
                  <Mail size={14} />
                  <p className="text-[0.875rem] font-normal text-[#707070]">
                    support@stellopay.com
                  </p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="pt-[1.5rem]">
                <h3 className="font-semibold text-[1rem] text-[#FFFFFF]">
                  Phone Number:
                </h3>
                <div className="flex gap-1 items-center">
                  <Phone size={14} />
                  <p className="text-[0.875rem] font-normal text-[#707070]">
                    +234 800 123 4567
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="pt-[1.5rem]">
                <h3 className="font-semibold text-[1rem] text-[#FFFFFF]">
                  Working Hours:
                </h3>
                <div className="flex gap-1 items-center">
                  <Clock3 size={14} />
                  <p className="text-[0.875rem] font-normal text-[#707070]">
                    Monday - Friday: 8 AM - 6 PM (WAT)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right div */}
          <form onSubmit={handleSubmit} className="w-full lg:w-[60%] space-y-5">
            <div className="w-full flex flex-col md:flex-row gap-5">
              <TextInput
                placeholder="Maya"
                label="First Name"
                onChange={handleFirstNameChange}
                value={firstName}
              />
              <TextInput
                placeholder="Sullivan"
                label="Last Name"
                onChange={handleLastNameChange}
                value={lastName}
              />
            </div>

            <EmailInput onChange={handleEmailChange} value={email} />

            <TextareaInput
              label="We would like to hear from you"
              placeholder="Describe your issue in detail"
              onChange={handleTextareaChange}
              value={textarea}
            />

            <Button
              text="Send Message"
              fill={true}
              disabled={isButtonDisabled}
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
