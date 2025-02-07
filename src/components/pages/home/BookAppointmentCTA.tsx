"use client"; // Ensure the component runs on the client side

import React from "react";

const BookAppointmentCTA: React.FC = () => (
  <section className="py-12 bg-brand-primary text-white text-center px-6">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
      <p className="text-lg text-neutral-lightest mb-8">
        Book an appointment today and find out how Zeta English Academy can help you achieve your goals.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/book-appointment"
          className="px-6 py-3 bg-brand-accent text-text-primary font-semibold rounded-lg shadow-lg hover:bg-brand-accent-dark transition"
        >
          Book Now
        </a>
        <a
          href="/contact"
          className="px-6 py-3 bg-white text-brand-primary font-semibold rounded-lg shadow-lg hover:bg-neutral-lightest hover:text-brand-primary-dark transition"
        >
          Contact Us
        </a>
      </div>
    </div>
  </section>
);

export default BookAppointmentCTA;
