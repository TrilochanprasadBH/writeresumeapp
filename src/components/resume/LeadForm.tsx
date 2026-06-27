"use client";

import { useState } from "react";
import { ArrowRight, Lock, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LeadData } from "@/types";

interface LeadFormProps {
  onSubmit: (data: LeadData) => void;
}

export function LeadForm({ onSubmit }: LeadFormProps) {
  const [fields, setFields] = useState({ name: "", email: "", phone: "+91 " });
  const [errors, setErrors] = useState<Partial<typeof fields>>({});

  function validate() {
    const e: Partial<typeof fields> = {};
    if (fields.name.trim().length < 2) e.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = "Valid email required";
    if (fields.phone.trim().length < 7) e.phone = "Phone is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: fields.name.trim(),
      email: fields.email.trim().toLowerCase(),
      phone: fields.phone.trim(),
    });
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
          <FileSearch className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Get your free resume score</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter your details — we&apos;ll show you the results instantly on this page.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              value={fields.name}
              onChange={(e) => setFields({ ...fields, name: e.target.value })}
              className="mt-1"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="jane@example.com"
              value={fields.email}
              onChange={(e) => setFields({ ...fields, email: e.target.value })}
              className="mt-1"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={fields.phone}
              onChange={(e) => setFields({ ...fields, phone: e.target.value })}
              className="mt-1"
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          <Button type="submit" className="w-full gap-2 py-4 text-base" size="lg">
            Continue to upload
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Lock className="h-3 w-3" />
          Your data is never sold or shared with third parties.
        </p>
      </div>
    </div>
  );
}
