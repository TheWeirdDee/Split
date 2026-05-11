"use client";

import React from 'react';
import { Card } from '../common/Card';

import { Users, FileText, Zap } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Create a group',
    description: 'Set up in 10 seconds. Share an invite link via WhatsApp or QR code.',
    icon: Users
  },
  {
    number: '02',
    title: 'Log expenses',
    description: 'Who paid. Who owes. Auto-calculated shares. No more manual math.',
    icon: FileText
  },
  {
    number: '03',
    title: 'Settle with cUSD',
    description: 'One tap. Instant. Onchain forever. No need for bank transfers.',
    icon: Zap
  }
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="clash-display font-bold text-4xl md:text-5xl">How it works</h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Simple, fast, and transparent. Designed for the Celo ecosystem.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <Card key={step.number} className="p-8 space-y-6 relative overflow-hidden group">
            <span className="absolute -top-4 -right-4 dm-mono text-8xl font-bold text-brand/5 group-hover:text-brand/10 transition-colors">
              {step.number}
            </span>
            <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mb-4">
              <step.icon className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h3 className="clash-display font-bold text-2xl">{step.title}</h3>
              <p className="text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
