// import React from 'react';
import { Navbar } from "../layout/Navbar";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { ProductShowcase } from "../components/landing/ProductShowcase";
import { Testimonials } from "../components/landing/Testimonials";
import { Pricing } from "../components/landing/Pricing";
import { CTA } from "../components/landing/CTA";
import { Footer } from "../layout/Footer";

export default function Landing() {
  useDocumentTitle("Home");
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <ProductShowcase />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
