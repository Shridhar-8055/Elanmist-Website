import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, shippingInfo } from "./products";

// Legal pages. Privacy and Shipping/Cancellation/Refund text is taken from the
// client's official policies on elanmist.com (Arunaraaga Impex, effective 05-03-2026).
// The Terms of Use are drafted from those facts — CONFIRM with the client before launch.

export type PolicySection = { heading: string; body?: string[]; points?: string[] };
export type Policy = { title: string; intro?: string[]; updated?: string; sections: PolicySection[] };

const company = "Arunaraaga Impex";
const sites = ["https://elanmist.com", "https://elanmist.in"];
const { email, phone } = shippingInfo.support;
const address = "#4937/121, Dr. B. R. Ambedkar Road, Venkateshwara Nagar, Hubballi – 580024, Karnataka, India";

const grievance: PolicySection = {
  heading: "Grievance officer",
  body: [
    "In accordance with the Information Technology Act, 2000, the Digital Personal Data Protection (DPDP) Act, 2023, and applicable rules:",
  ],
  points: [company, `Email: ${email}`, `Phone: ${phone}`, `Address: ${address}`],
};

export const policies: Record<string, Policy> = {
  privacy: {
    title: "Privacy Policy",
    intro: [
      `This Privacy Policy describes how ${company} ("Company", "We", "Our", "Us") collects, uses, stores, and protects your personal information when you visit or purchase from ${sites.join(" or ")}.`,
      "By accessing or using our Website, you agree to the practices described in this Privacy Policy.",
    ],
    sections: [
      {
        heading: "1. Information we collect",
        body: ["A. Personal information. When you place an order or create an account, we may collect:"],
        points: [
          "Full name",
          "Email address",
          "Phone number",
          "Shipping and billing address",
          "Payment information",
          "IP address",
          "Order history",
        ],
      },
      {
        heading: "B. Payment information",
        points: [
          "All online payments are securely processed through Razorpay.",
          "We do not store your full card details or CVV information.",
        ],
      },
      {
        heading: "C. Device & usage information",
        body: ["We may automatically collect:"],
        points: ["Browser type", "Device type", "Operating system", "Pages visited", "Time spent on the Website", "Cookies and analytics data"],
      },
      {
        heading: "2. How we use your information",
        points: [
          "Processing and fulfilling orders",
          "Customer support and grievance resolution",
          "Sending order updates",
          "Improving our Website and services",
          "Marketing and promotional communication (only if you opt in)",
          "Fraud detection and security monitoring",
          "Compliance with legal obligations",
        ],
      },
      {
        heading: "3. Cookies & tracking technologies",
        body: ["We use cookies and similar tracking technologies to:"],
        points: ["Enhance user experience", "Analyse website traffic", "Remember preferences", "Improve marketing performance"],
      },
      {
        heading: "",
        body: ["You may disable cookies in your browser settings. However, some features may not function properly."],
      },
      {
        heading: "4. Sharing of information",
        body: ["We do not sell your personal data. We may share your information with:"],
        points: [
          "Payment gateway providers (e.g., Razorpay)",
          "Courier and logistics partners",
          "Technology and analytics providers",
          "Review platform (Wiser Review) for customer feedback",
          "Government authorities when required by law",
        ],
      },
      { heading: "", body: ["All third-party partners are obligated to maintain confidentiality."] },
      {
        heading: "5. Data retention & legal compliance",
        body: ["We retain personal data only for as long as necessary to:"],
        points: ["Fulfil orders", "Comply with legal and tax requirements", "Resolve disputes", "Enforce agreements"],
      },
      {
        heading: "",
        body: [
          "Separation of marketing and transactional data: when a user exercises their right to request data deletion, we will promptly remove them from all marketing, promotional, and analytics databases. However, transaction records, IP addresses at the time of purchase, and shipping details will be securely retained as legally required under Indian tax laws and for fraud prevention purposes, overriding standard deletion requests. After this required period, data may be securely deleted or anonymised.",
        ],
      },
      {
        heading: "6. Data security",
        body: ["We implement reasonable administrative, technical, and physical safeguards to protect your data from:"],
        points: ["Unauthorised access", "Misuse", "Alteration", "Disclosure"],
      },
      { heading: "", body: ["However, no online system is completely secure. Use of the Website is at your own risk."] },
      {
        heading: "7. Your rights (under Indian law)",
        body: ["Subject to applicable laws, including the Digital Personal Data Protection (DPDP) Act, 2023, you may:"],
        points: [
          "Request access to your personal data",
          "Request correction of inaccurate information",
          "Request deletion of personal data (subject to legal and tax retention obligations)",
          "Withdraw consent for marketing communications",
        ],
      },
      {
        heading: "",
        body: [
          `To exercise these rights, contact us at ${email}. To request data deletion, please use the subject line "Data Deletion Request" in your email.`,
        ],
      },
      {
        heading: "8. Marketing communications",
        body: ["You may receive promotional emails, SMS, or WhatsApp messages only if you opt in. You can unsubscribe anytime via:"],
        points: ["The unsubscribe link in our emails", "Contacting customer support"],
      },
      {
        heading: "9. Children's privacy",
        body: ["Our Website is not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors."],
      },
      {
        heading: "10. Third-party links",
        body: [
          "Our Website may contain links to third-party websites. We are not responsible for their privacy practices. Users are encouraged to review third-party privacy policies separately.",
        ],
      },
      {
        heading: "11. Data transfer",
        body: ["Your information may be processed and stored within India. By using our Website, you consent to such processing."],
      },
      {
        ...grievance,
        heading: "12. Grievance officer",
      },
      { heading: "", body: ["Complaints will be acknowledged within 48 hours and resolved within 15 working days."] },
      {
        heading: "13. Changes to this Privacy Policy",
        body: [
          "We reserve the right to update this Privacy Policy at any time. Any changes will be posted on this page with the updated effective date. Continued use of the Website constitutes acceptance of the revised policy.",
        ],
      },
    ],
  },

  "shipping-and-returns": {
    title: "Shipping, Cancellation & Refund Policy",
    updated: "Effective date: 05-03-2026",
    intro: [
      `This policy applies to all purchases made on ${sites.join(" and ")}, operated by ${company}. By placing an order, you agree to the terms outlined below.`,
    ],
    sections: [
      {
        heading: "1. Shipping policy",
        body: ["1.1 Shipping charges"],
        points: [
          `Free shipping on orders above ₹${FREE_SHIPPING_THRESHOLD}.`,
          `Orders below ₹${FREE_SHIPPING_THRESHOLD} carry a ₹${SHIPPING_FEE} shipping fee, displayed at checkout.`,
        ],
      },
      {
        heading: "1.2 Order processing time",
        points: ["Orders are typically processed within 1–2 business days.", "Orders are not processed on Sundays or public holidays."],
      },
      {
        heading: "1.3 Delivery timeline",
        points: [
          "Estimated delivery time: 5–7 business days from dispatch.",
          "Delivery timelines may vary depending on location, courier partner delays, public holidays and unforeseen circumstances.",
          "Delivery timelines are estimates and not guaranteed.",
        ],
      },
      {
        heading: "1.4 Remote or non-serviceable areas",
        points: [
          "Delivery timelines may extend for remote locations.",
          "If a pincode is non-serviceable, we reserve the right to cancel the order and issue a refund.",
        ],
      },
      {
        heading: "1.5 Incorrect address details",
        points: [
          "Customers are responsible for providing accurate shipping information.",
          "If an order is returned due to an incorrect address, incomplete details, or an unreachable phone number, reshipping charges may apply.",
          "Shipping fees are non-refundable in such cases.",
        ],
      },
      {
        heading: "1.6 Partial shipments",
        points: [
          "If multiple products are ordered, items may be shipped separately based on availability.",
          "No additional shipping charge will apply if the order qualifies for free shipping.",
        ],
      },
      {
        heading: "1.7 Packaging tampering & delivery acceptance",
        points: [
          "If the outer packaging appears damaged, opened, or tampered with, customers must refuse delivery or record clear video evidence at the time of receipt.",
          "Failure to provide proof may result in rejection of damage claims.",
        ],
      },
      {
        heading: "1.8 Lost or marked-delivered orders",
        points: [
          'If tracking shows "Delivered" but the package is not received, the customer must notify us within 48 hours.',
          "We will initiate an investigation with the courier partner.",
          "Refund or replacement will be processed only after confirmation from the logistics provider.",
        ],
      },
      {
        heading: "2. Payment",
        points: [
          "Orders on this website are prepaid through Razorpay: UPI, credit and debit cards, netbanking and wallets.",
          "Payments are processed securely by Razorpay. We never see or store your card details.",
        ],
      },
      {
        heading: "3. Cancellation policy",
        body: ["3.1 Order cancellation (prepaid orders)"],
        points: [
          "Orders can be cancelled before dispatch.",
          "Once dispatched, cancellation is not permitted.",
          "Refunds for cancelled prepaid orders will be processed within 7–10 business days to the original payment method.",
        ],
      },
      {
        heading: "3.2 Cash on delivery (COD) orders",
        points: [
          "Where COD is offered, COD orders may be cancelled before dispatch.",
          "Repeated rejection or failed delivery of COD orders may result in restriction of the COD option or a requirement of prepaid orders for future purchases.",
          "We reserve the right to refuse COD service in case of suspected misuse.",
        ],
      },
      {
        heading: "4. Return policy",
        body: ["Due to hygiene and safety reasons, we maintain a strict No Return Policy. Returns will not be accepted for:"],
        points: ["Change of mind or personal preference", "Skin incompatibility", "Opened or used products", "Minor packaging variations"],
      },
      {
        heading: "5. Refund & replacement policy",
        body: ["Refunds or replacements will only be processed in the following cases:"],
        points: ["Product received in damaged condition", "Incorrect product delivered", "Verified manufacturing defect"],
      },
      {
        heading: "5.1 Conditions for a request",
        body: ["The customer must:"],
        points: [
          "Report the issue within 48 hours of delivery.",
          "Provide an uncut, unedited unboxing video that clearly shows the sealed package, the Elanmist shipping label, and the full opening process. Requests without this evidence will be rejected.",
          "Provide supporting photographs, order number, and contact details.",
        ],
      },
      {
        heading: "5.2 Refund & replacement process",
        points: [
          "Replacement first: Elanmist reserves the right to offer a replacement of the exact same product before processing a financial refund.",
          "Once verified and approved for a refund, processing takes 7–10 business days.",
          "Prepaid orders: refunded to the original payment method.",
          "COD orders: customers must provide a valid bank account or UPI ID in the name of the purchaser. We do not issue cash refunds for delivered COD orders.",
          "Shipping charges (if applicable) are non-refundable unless the error is from our side.",
          "The Company reserves the final right to approve or reject claims after verification.",
        ],
      },
      {
        heading: "6. RTO (return to origin) policy",
        body: [
          "If a COD order is rejected at the doorstep, not accepted after delivery attempts, or returned due to customer unavailability, the shipment will be marked as RTO. In such cases:",
        ],
        points: [
          "The COD option may be restricted for future orders.",
          "The Company reserves the right to recover shipping losses in case of repeated misuse.",
        ],
      },
      {
        heading: "7. Contact for shipping & refund issues",
        points: [`Email: ${email}`, `Phone: ${phone}`],
        body: ["Complaints will be acknowledged within 48 hours and resolved within a reasonable time."],
      },
    ],
  },

  // CONFIRM: drafted from the client's own facts — the client's existing "Terms"
  // page contains the shipping/refund policy instead. Have the client approve this.
  terms: {
    title: "Terms & Conditions",
    intro: [
      `These Terms & Conditions govern your use of ${sites.join(" and ")} (the "Website") and any purchase you make on it. The Website is operated by ${company}, ${address}.`,
      "By using the Website or placing an order, you agree to these Terms, our Privacy Policy, and our Shipping, Cancellation & Refund Policy.",
    ],
    sections: [
      {
        heading: "1. Eligibility",
        body: ["You must be at least 18 years old, or use the Website under the supervision of a parent or guardian, to place an order."],
      },
      {
        heading: "2. Products & information",
        points: [
          "We make every effort to display products, ingredients and prices accurately. Colours and packaging may vary slightly from images.",
          "Our products are cosmetic skincare products and are not intended to diagnose, treat, cure or prevent any disease.",
          "Always read the label and perform a patch test before first use. Discontinue use if irritation occurs and consult a dermatologist if needed.",
        ],
      },
      {
        heading: "3. Pricing & payment",
        points: [
          "All prices are in Indian Rupees (₹) and inclusive of applicable taxes unless stated otherwise.",
          "Shipping charges, if any, are shown at checkout before you pay.",
          "Payments are processed securely by Razorpay. We do not store your card details.",
          "We reserve the right to correct pricing errors and to cancel orders placed at an incorrect price, with a full refund.",
        ],
      },
      {
        heading: "4. Orders",
        points: [
          "An order is confirmed only after successful payment.",
          "We may cancel an order if a product is unavailable, the delivery pincode is not serviceable, or we suspect fraud or misuse. Any amount paid will be refunded.",
        ],
      },
      {
        heading: "5. Shipping, cancellation & refunds",
        body: ["Delivery, cancellation, returns and refunds are governed by our Shipping, Cancellation & Refund Policy."],
      },
      {
        heading: "6. Intellectual property",
        body: [
          "All content on the Website — including the Elanmist name and logo, text, product photography and design — belongs to the Company or its licensors and may not be copied or used without written permission.",
        ],
      },
      {
        heading: "7. Acceptable use",
        body: [
          "You agree not to misuse the Website, including attempting unauthorised access, interfering with its operation, placing fraudulent orders, or submitting false information.",
        ],
      },
      {
        heading: "8. Limitation of liability",
        body: [
          "To the extent permitted by law, the Company is not liable for indirect or consequential losses arising from the use of the Website or products. Our total liability for any order is limited to the amount paid for that order.",
        ],
      },
      {
        heading: "9. Governing law",
        // CONFIRM: jurisdiction chosen to match the registered address in Hubballi.
        body: ["These Terms are governed by the laws of India. Disputes are subject to the jurisdiction of the courts at Hubballi, Karnataka."],
      },
      {
        heading: "10. Changes",
        body: ["We may update these Terms at any time. Changes take effect when posted on this page."],
      },
      {
        heading: "11. Contact",
        points: [`Email: ${email}`, `Phone: ${phone}`, `Address: ${address}`],
      },
    ],
  },
};
