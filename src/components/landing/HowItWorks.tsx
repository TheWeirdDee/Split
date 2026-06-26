"use client";

import React from "react";

/**
 * Static three-step "how it works" section (create → log/contribute → settle).
 */
export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-[#0a0a0a] py-32 px-8 max-w-[1280px] mx-auto">
      <div className="text-center mb-24 reveal">
        <h2 className="clash-display font-bold text-[clamp(36px,5vw,56px)] text-[#f5f0e8] mb-4">Simple by design.</h2>
        <p className="dm-sans text-[#7a7a7a] text-[16px] max-w-xl mx-auto">Getting started is easier than sending a WhatsApp message.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-16 relative">
        <div className="hidden md:block absolute top-[110px] left-[15%] w-[70%] border-t border-dashed border-[#242424] z-0" />
        {[
          { num: "01", title: "Create Group or Circle", desc: "Create a split group or a collaborative savings circle in 10 seconds." },
          { num: "02", title: "Log Costs or Contribute", desc: "Log shared expenses or make regular usdm contributions to your circle." },
          { num: "03", title: "Settle & Cashout", desc: "Settle net balances or withdraw your circular savings payout pot instantly." },
        ].map((s, i) => (
          <div key={i} className="reveal relative z-10 flex flex-col items-center text-center">
            <span className="dm-mono text-[72px] md:text-[80px] font-bold text-[#00C896] opacity-[0.1] leading-none mb-6">{s.num}</span>
            <div className="w-14 h-14 rounded-full border border-[#242424] bg-[#0a0a0a] flex items-center justify-center mb-8 relative">
               <div className="w-2 h-2 rounded-full bg-[#00C896]" />
            </div>
            <h3 className="clash-display font-bold text-[20px] text-[#f5f0e8] mb-4">{s.title}</h3>
            <p className="dm-sans text-[14px] text-[#7a7a7a] leading-[1.6] max-w-[240px]">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
