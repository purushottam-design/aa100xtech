import { site } from "@/data/site";
import type { LegalSection } from "@/components/legal-page";

export const legalDates = {
  effective: "17 August 2026",
  updated: "17 August 2026",
};

const contactLine = `Email ${site.email}, call ${site.phone}, or write to ${site.legalName}, ${site.address}. Support hours: ${site.hours}.`;

export const privacySections: LegalSection[] = [
  {
    id: "introduction",
    heading: "1. Introduction",
    blocks: [
      {
        type: "p",
        text: `${site.legalName} ("AA100XTech", "we", "us") operates ${site.domain} and provides IT, design, AI and digital marketing services. This Privacy Policy explains what information we collect through this website, how we use it and the choices you have.`,
      },
      {
        type: "p",
        text: "By using this website or submitting any form on it, you agree to the practices described here.",
      },
    ],
  },
  {
    id: "information-we-collect",
    heading: "2. Information we collect",
    blocks: [
      {
        type: "sub",
        heading: "Personal information",
        blocks: [
          {
            type: "p",
            text: "Information you voluntarily submit through our contact, careers, candidate submission and partnership application forms — such as your name, email address, phone number, company or brand details, social profiles, portfolio links, message content and any files you upload.",
          },
        ],
      },
      {
        type: "sub",
        heading: "Account information",
        blocks: [
          {
            type: "p",
            text: "Accounts on this website are issued by the company, not self-created. When an account is approved we store the username, login email, phone number and account type (employee, customer or job seeker) associated with it. Passwords are stored only in hashed form by our authentication provider and are never visible to us in plain text.",
          },
        ],
      },
      {
        type: "sub",
        heading: "Payment information",
        blocks: [
          {
            type: "p",
            text: "This website does not currently process online payments and does not host a checkout or payment gateway. Project fees are invoiced and settled outside the website. Any billing details you share for invoicing are handled by our finance team and by our bank or payment processor — we do not store card numbers, UPI credentials or bank passwords on this website.",
          },
        ],
      },
      {
        type: "sub",
        heading: "Device and technical information",
        blocks: [
          {
            type: "p",
            text: "Our hosting and backend providers automatically record standard technical data such as IP address, browser type, device type, referring page, pages visited and timestamps, for security, abuse prevention and reliability purposes.",
          },
        ],
      },
    ],
  },
  {
    id: "how-we-use-information",
    heading: "3. How we use information",
    blocks: [
      {
        type: "list",
        items: [
          "To respond to enquiries and prepare proposals, quotes and project plans",
          "To review job applications, candidate task submissions and partnership applications",
          "To create, issue and administer company-approved accounts",
          "To deliver, support and improve the services you have engaged us for",
          "To send service-related communications about your enquiry, project or account",
          "To maintain the security, integrity and performance of the website",
          "To comply with applicable legal, tax and regulatory obligations",
        ],
      },
    ],
  },
  {
    id: "how-we-share",
    heading: "4. How we share information",
    blocks: [
      {
        type: "p",
        text: "We do not sell your personal information. We share it only with:",
      },
      {
        type: "list",
        items: [
          "Service providers who operate our website infrastructure, database, file storage and email delivery, strictly to run the service",
          "Professional advisers (such as accountants or legal counsel) where necessary",
          "Authorities, where we are required to do so by law or valid legal process",
          "A successor entity, in the event of a merger, acquisition or reorganisation",
        ],
      },
    ],
  },
  {
    id: "payment-gateway",
    heading: "5. Payment gateway and third-party services",
    blocks: [
      {
        type: "p",
        text: "No payment gateway is integrated into this website at present. If a payment gateway is added in future, payment details will be collected and processed directly by that gateway under its own privacy policy and terms, and this policy will be updated to name the provider.",
      },
      {
        type: "p",
        text: "We rely on third-party providers for hosting, database, authentication, file storage and web fonts. These providers process data on our behalf under their own terms.",
      },
    ],
  },
  {
    id: "cookies",
    heading: "6. Cookies and tracking technologies",
    blocks: [
      {
        type: "p",
        text: "We use a small number of cookies and similar browser storage mechanisms, primarily to keep signed-in users authenticated. See our Cookie Policy for details on the categories used and how to manage them.",
      },
    ],
  },
  {
    id: "storage-security",
    heading: "7. Data storage and security",
    blocks: [
      {
        type: "p",
        text: "Form submissions, account records and uploaded files are stored in a managed cloud database and private file storage. Access is restricted through row-level security rules and role-based permissions, and uploaded candidate files are kept in a private bucket that is not publicly readable.",
      },
      {
        type: "p",
        text: "No method of transmission or storage is completely secure. We take reasonable technical and organisational measures appropriate to our size and the nature of the data, but we cannot guarantee absolute security.",
      },
    ],
  },
  {
    id: "retention",
    heading: "8. Data retention",
    blocks: [
      {
        type: "p",
        text: "We retain personal information for as long as needed for the purpose it was collected, for the duration of an active engagement or account, and thereafter for the period required by applicable law and our internal record-keeping requirements. [Placeholder: specific retention periods to be confirmed by the company.]",
      },
    ],
  },
  {
    id: "user-rights",
    heading: "9. Your rights",
    blocks: [
      {
        type: "list",
        items: [
          "Request access to the personal information we hold about you",
          "Request correction of inaccurate or incomplete information",
          "Request deletion of your information, subject to legal and contractual limits",
          "Withdraw consent for non-essential communications",
          "Raise a grievance with our contact point listed below",
        ],
      },
      {
        type: "p",
        text: "To exercise any of these rights, contact us using the details at the end of this page. We may ask you to verify your identity before acting on a request.",
      },
    ],
  },
  {
    id: "deletion",
    heading: "10. Account and data deletion requests",
    blocks: [
      {
        type: "p",
        text: `Send a deletion request from your registered email address to ${site.email} with the subject line "Data deletion request". We will confirm receipt and process the request, except where we are required to retain certain records for legal, tax or contractual reasons. [Placeholder: turnaround time to be confirmed by the company.]`,
      },
    ],
  },
  {
    id: "children",
    heading: "11. Children's privacy",
    blocks: [
      {
        type: "p",
        text: "This website and our services are intended for businesses and adults. We do not knowingly collect personal information from children. If you believe a child has provided information to us, contact us and we will delete it.",
      },
    ],
  },
  {
    id: "third-party-links",
    heading: "12. Third-party links",
    blocks: [
      {
        type: "p",
        text: "Our website links to client websites, social platforms and video hosting services. We are not responsible for the content or privacy practices of those third parties. Review their policies before sharing information with them.",
      },
    ],
  },
  {
    id: "changes",
    heading: "13. Changes to this Privacy Policy",
    blocks: [
      {
        type: "p",
        text: "We may update this policy from time to time. The revised version will be posted on this page with a new effective date. Continued use of the website after an update constitutes acceptance of the revised policy.",
      },
    ],
  },
  {
    id: "contact",
    heading: "14. Contact information",
    blocks: [{ type: "p", text: contactLine }],
  },
];

export const termsSections: LegalSection[] = [
  {
    id: "introduction",
    heading: "1. Introduction",
    blocks: [
      {
        type: "p",
        text: `These Terms & Conditions govern your use of ${site.domain} and any services provided by ${site.legalName}. Please read them carefully.`,
      },
    ],
  },
  {
    id: "acceptance",
    heading: "2. Acceptance of terms",
    blocks: [
      {
        type: "p",
        text: "By accessing, browsing or submitting information through this website, you agree to be bound by these terms. If you do not agree, please do not use the website.",
      },
    ],
  },
  {
    id: "eligibility",
    heading: "3. Eligibility",
    blocks: [
      {
        type: "p",
        text: "You must be at least 18 years old and legally capable of entering into a binding contract to use this website or engage our services. If you use the website on behalf of an organisation, you confirm that you are authorised to bind that organisation.",
      },
    ],
  },
  {
    id: "accounts",
    heading: "4. Account registration",
    blocks: [
      {
        type: "p",
        text: "Accounts on this website are not self-created. You may submit an access request; the company reviews it and, if approved, issues your username, login email, registered phone number, account type and an initial password. You are responsible for changing the allotted password, keeping your credentials confidential, and for all activity under your account. Notify us immediately of any unauthorised use.",
      },
    ],
  },
  {
    id: "user-responsibilities",
    heading: "5. User responsibilities",
    blocks: [
      {
        type: "list",
        items: [
          "Provide accurate, current and complete information in any form you submit",
          "Use the website and services only for lawful purposes",
          "Do not share your account credentials with anyone else",
          "Ensure you hold the rights to any content, footage, imagery, voice or brand assets you supply to us",
        ],
      },
    ],
  },
  {
    id: "website-usage",
    heading: "6. Website usage rules",
    blocks: [
      {
        type: "p",
        text: "You may view and use this website for legitimate business purposes. You may not scrape, mirror, resell, reverse-engineer or systematically extract content from the website, or attempt to gain unauthorised access to any part of it or its underlying infrastructure.",
      },
    ],
  },
  {
    id: "service-access",
    heading: "7. Service and deliverable access",
    blocks: [
      {
        type: "p",
        text: "Services listed on this website — including website and app development, AI avatar and video production, voice services, digital identity packages, e-commerce builds and marketing retainers — are delivered under a separate written proposal, quotation or agreement that defines scope, milestones, deliverables and timelines. Website listings and prices are indicative and do not constitute an offer or a binding contract on their own.",
      },
    ],
  },
  {
    id: "pricing",
    heading: "8. Pricing and payments",
    blocks: [
      {
        type: "p",
        text: "Prices shown on this website are indicative starting points and may change without notice. Final pricing, currency, taxes and payment schedule are set out in the proposal or invoice issued for your engagement. Applicable taxes, including GST where relevant, are charged in addition unless expressly stated otherwise.",
      },
      {
        type: "p",
        text: "This website does not process online payments. Payments are made against invoices issued by the company through the channels stated on the invoice.",
      },
    ],
  },
  {
    id: "payment-gateway-terms",
    heading: "9. Payment gateway terms",
    blocks: [
      {
        type: "p",
        text: "No payment gateway is currently integrated into this website. If one is introduced, transactions will additionally be governed by that gateway's terms and privacy policy, and this section will be updated to name the provider. [Placeholder: payment gateway details to be added when live.]",
      },
    ],
  },
  {
    id: "order-confirmation",
    heading: "10. Order and engagement confirmation",
    blocks: [
      {
        type: "p",
        text: "Submitting a form on this website is an enquiry or application, not a confirmed order. An engagement begins only when we issue a written proposal or invoice and you accept it in writing. Career and partnership applications are reviewed at the company's discretion and do not guarantee selection, employment or partnership.",
      },
    ],
  },
  {
    id: "ip",
    heading: "11. Intellectual property rights",
    blocks: [
      {
        type: "p",
        text: "All content on this website — including text, layout, graphics, logos, and code — is owned by or licensed to the company and protected by applicable intellectual property laws. Ownership of project deliverables transfers as set out in your signed agreement, typically upon full payment.",
      },
    ],
  },
  {
    id: "copyright",
    heading: "12. Copyright and trademark",
    blocks: [
      {
        type: "p",
        text: "The AA100XTech name, logo and brand marks may not be used without prior written permission. Client names and logos shown on this website remain the property of their respective owners and are displayed for identification purposes only.",
      },
    ],
  },
  {
    id: "prohibited",
    heading: "13. Prohibited activities",
    blocks: [
      {
        type: "list",
        items: [
          "Uploading malware, malicious code or attempting to disrupt the website",
          "Probing, scanning or breaching authentication or security measures",
          "Submitting false, fraudulent or impersonating information",
          "Uploading content that infringes third-party rights or is unlawful, defamatory or obscene",
          "Automated scraping, spamming or bulk form submission",
        ],
      },
    ],
  },
  {
    id: "ugc",
    heading: "14. User-generated content",
    blocks: [
      {
        type: "p",
        text: "When you upload briefs, files, portfolios, media or application content, you confirm you own or are licensed to share it and you grant us a limited licence to store, review and use it for the purpose it was submitted. We may remove any submitted content at our discretion.",
      },
    ],
  },
  {
    id: "third-party",
    heading: "15. Third-party services",
    blocks: [
      {
        type: "p",
        text: "The website embeds or links to third-party services such as video hosting, fonts, maps and social platforms. Their availability and behaviour are outside our control and are governed by their own terms.",
      },
    ],
  },
  {
    id: "availability",
    heading: "16. Service availability",
    blocks: [
      {
        type: "p",
        text: "We aim to keep the website available at all times but do not guarantee uninterrupted or error-free access. We may suspend or modify the website for maintenance, upgrades or reasons beyond our control without notice.",
      },
    ],
  },
  {
    id: "liability",
    heading: "17. Limitation of liability",
    blocks: [
      {
        type: "p",
        text: "To the maximum extent permitted by law, the company is not liable for indirect, incidental, special or consequential losses, including loss of profits, revenue, data or business opportunity, arising from your use of this website. Liability arising from a paid engagement is governed by the limitation set out in the applicable signed agreement.",
      },
    ],
  },
  {
    id: "indemnification",
    heading: "18. Indemnification",
    blocks: [
      {
        type: "p",
        text: "You agree to indemnify and hold harmless the company, its directors and employees against claims, damages and reasonable expenses arising from your breach of these terms, your misuse of the website, or content you submit that infringes third-party rights.",
      },
    ],
  },
  {
    id: "termination",
    heading: "19. Account suspension and termination",
    blocks: [
      {
        type: "p",
        text: "We may suspend or terminate access to an issued account at any time where we reasonably believe these terms have been breached, where the account is no longer required, or where required by law. You may request closure of your account by contacting us.",
      },
    ],
  },
  {
    id: "governing-law",
    heading: "20. Governing law",
    blocks: [
      {
        type: "p",
        text: "These terms are governed by the laws of India, and the courts at Patna, Bihar shall have jurisdiction, unless a signed agreement between us states otherwise.",
      },
    ],
  },
  {
    id: "disputes",
    heading: "21. Dispute resolution",
    blocks: [
      {
        type: "p",
        text: "Before initiating formal proceedings, both parties agree to attempt a good-faith resolution by contacting our grievance point of contact. [Placeholder: formal arbitration or escalation mechanism to be confirmed by the company.]",
      },
    ],
  },
  {
    id: "changes",
    heading: "22. Changes to these terms",
    blocks: [
      {
        type: "p",
        text: "We may revise these terms at any time. The current version is always the one published on this page, with its effective date shown above.",
      },
    ],
  },
  {
    id: "contact",
    heading: "23. Contact information",
    blocks: [{ type: "p", text: contactLine }],
  },
];

export const refundSections: LegalSection[] = [
  {
    id: "scope",
    heading: "1. Scope",
    blocks: [
      {
        type: "p",
        text: "This policy covers cancellations and refunds for services engaged with the company. Because our work is delivered as custom professional services under a written proposal or agreement, the commercial terms of that document — including milestone payments, advances and cancellation terms — take precedence over this page.",
      },
    ],
  },
  {
    id: "cancellation",
    heading: "2. Cancellation rules",
    blocks: [
      {
        type: "p",
        text: "You may request cancellation of an engagement in writing at any time. Work already performed, third-party costs already incurred (such as licences, domains, hosting, ad spend, stock media or app-store fees) and approved milestones remain payable. [Placeholder: notice period for cancellation to be confirmed by the company.]",
      },
    ],
  },
  {
    id: "eligibility",
    heading: "3. Refund eligibility",
    blocks: [
      {
        type: "p",
        text: "Refund eligibility is assessed case by case against the stage of delivery and the terms of your agreement. We do not publish a fixed refund percentage on this website. [Placeholder: refund eligibility conditions and percentages to be confirmed by the company.]",
      },
    ],
  },
  {
    id: "time-limits",
    heading: "4. Refund request time limits",
    blocks: [
      {
        type: "p",
        text: "Refund requests should be raised as soon as possible after the event giving rise to the request. [Placeholder: request window to be confirmed by the company.]",
      },
    ],
  },
  {
    id: "non-refundable",
    heading: "5. Non-refundable items",
    blocks: [
      {
        type: "p",
        text: "The following are generally non-refundable once incurred or delivered:",
      },
      {
        type: "list",
        items: [
          "Third-party pass-through costs such as domain registrations, hosting, licences, plugins, stock assets, app-store fees and paid ad spend",
          "Work already completed, delivered or approved at the time of cancellation",
          "Custom production output already rendered and handed over, such as video edits, avatar renders, voice output and design files",
          "Time-based retainer periods already served",
        ],
      },
    ],
  },
  {
    id: "enrollment",
    heading: "6. Programme and enrolment cancellations",
    blocks: [
      {
        type: "p",
        text: "Applications submitted through the careers or influencer partnership pages are free to submit and carry no payment, so no refund arises. If a paid programme or enrolment is introduced in future, its cancellation terms will be published with it. [Placeholder: paid programme terms to be added when applicable.]",
      },
    ],
  },
  {
    id: "duplicate",
    heading: "7. Duplicate payments",
    blocks: [
      {
        type: "p",
        text: "If you are charged twice for the same invoice, notify us with both transaction references. Verified duplicate payments are refunded in full to the original payment method, or adjusted against your next invoice if you prefer.",
      },
    ],
  },
  {
    id: "failed",
    heading: "8. Failed payments",
    blocks: [
      {
        type: "p",
        text: "If an amount is debited but the payment is not confirmed against your invoice, share the transaction reference and date with us. Such amounts are typically reversed automatically by the bank or processor; if not, we will assist in tracing and resolving it with them.",
      },
    ],
  },
  {
    id: "processing",
    heading: "9. Refund processing timeline",
    blocks: [
      {
        type: "p",
        text: "Approved refunds are initiated from our side to the original payment method. The time for funds to reflect depends on your bank or payment processor. [Placeholder: internal processing timeline to be confirmed by the company.]",
      },
    ],
  },
  {
    id: "gateway",
    heading: "10. Payment gateway refund process",
    blocks: [
      {
        type: "p",
        text: "This website does not host a payment gateway or online checkout. Payments are made against invoices, so refunds are processed by our finance team through the same channel used for the original payment. If a gateway is added in future, refunds will additionally follow that gateway's process and timelines.",
      },
    ],
  },
  {
    id: "how-to-request",
    heading: "11. How to request a refund",
    blocks: [
      {
        type: "p",
        text: `Email ${site.email} with the subject line "Refund request" from the email address associated with the engagement.`,
      },
      {
        type: "sub",
        heading: "Information to include",
        blocks: [
          {
            type: "list",
            items: [
              "Your name, company name and registered contact number",
              "Invoice or proposal reference number",
              "Payment date, amount and transaction reference",
              "Service or deliverable the request relates to",
              "Reason for the refund request and any supporting evidence",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "rejection",
    heading: "12. When a refund may be rejected",
    blocks: [
      {
        type: "list",
        items: [
          "The deliverable has been completed, delivered or approved as per the agreed scope",
          "The request falls outside the terms of your signed agreement",
          "The amount relates to non-refundable third-party costs",
          "The delay or issue was caused by pending inputs, approvals or access from your side",
          "The request cannot be verified against a valid invoice and payment record",
        ],
      },
    ],
  },
  {
    id: "contact",
    heading: "13. Contact information",
    blocks: [{ type: "p", text: contactLine }],
  },
];

export const cookieSections: LegalSection[] = [
  {
    id: "what-are-cookies",
    heading: "1. What are cookies",
    blocks: [
      {
        type: "p",
        text: "Cookies are small text files placed on your device by a website. Similar technologies, such as browser local storage, work the same way. They let a site remember your session and preferences and help operators understand how the site is used.",
      },
    ],
  },
  {
    id: "types",
    heading: "2. Types of cookies we use",
    blocks: [
      {
        type: "sub",
        heading: "Essential cookies",
        blocks: [
          {
            type: "p",
            text: "Required for the website to work. On this site they are used to keep signed-in users authenticated and to protect forms and accounts. These cannot be switched off without breaking sign-in.",
          },
        ],
      },
      {
        type: "sub",
        heading: "Functional cookies",
        blocks: [
          {
            type: "p",
            text: "Remember choices such as your session state so you are not asked to sign in repeatedly during a visit.",
          },
        ],
      },
      {
        type: "sub",
        heading: "Analytics cookies",
        blocks: [
          {
            type: "p",
            text: "Used to understand aggregate usage of the website. [Placeholder: analytics tooling to be confirmed by the company. No third-party analytics cookies are set on this website at present.]",
          },
        ],
      },
      {
        type: "sub",
        heading: "Marketing cookies",
        blocks: [
          {
            type: "p",
            text: "Used for advertising and remarketing. We do not currently set marketing cookies on this website. If this changes, this policy will be updated before they are enabled.",
          },
        ],
      },
      {
        type: "sub",
        heading: "Third-party cookies",
        blocks: [
          {
            type: "p",
            text: "Embedded content such as videos, fonts or maps may set cookies from those providers when you load a page that contains them. Those cookies are controlled by the provider, not by us.",
          },
        ],
      },
    ],
  },
  {
    id: "manage",
    heading: "3. How you can manage cookies",
    blocks: [
      {
        type: "p",
        text: "You can block or delete cookies in your browser settings, and most browsers offer a private browsing mode. Blocking essential cookies will prevent sign-in and account features from working.",
      },
    ],
  },
  {
    id: "consent",
    heading: "4. Cookie consent",
    blocks: [
      {
        type: "p",
        text: "By continuing to use this website you consent to the essential and functional cookies described above. Because no analytics or marketing cookies are currently in use, no consent banner is displayed. If non-essential cookies are introduced, we will ask for consent before setting them.",
      },
    ],
  },
  {
    id: "changes",
    heading: "5. Changes to this Cookie Policy",
    blocks: [
      {
        type: "p",
        text: "We may update this policy as our use of cookies changes. The current version is always published on this page with its effective date.",
      },
    ],
  },
  {
    id: "contact",
    heading: "6. Contact information",
    blocks: [{ type: "p", text: contactLine }],
  },
];

export const disclaimerSections: LegalSection[] = [
  {
    id: "general",
    heading: "1. General disclaimer",
    blocks: [
      {
        type: "p",
        text: `The content on ${site.domain} is provided for general information about ${site.legalName} and its services. It is provided "as is" without warranties of any kind, express or implied.`,
      },
    ],
  },
  {
    id: "informational",
    heading: "2. Informational and educational content",
    blocks: [
      {
        type: "p",
        text: "Any guidance, articles, service descriptions, career materials or partnership programme information on this website is informational only. It is not professional, legal, financial, tax or investment advice, and it should not be relied upon as a substitute for advice tailored to your situation.",
      },
    ],
  },
  {
    id: "no-guarantee",
    heading: "3. No guarantee of results",
    blocks: [
      {
        type: "p",
        text: "Statistics, case studies, growth figures, commission tiers and outcomes shown on this website describe past or illustrative scenarios. They are not a promise or guarantee of results. Business outcomes depend on market conditions, budget, execution and factors outside our control.",
      },
    ],
  },
  {
    id: "accuracy",
    heading: "4. Accuracy of information",
    blocks: [
      {
        type: "p",
        text: "We take care to keep information, pricing and service details current, but we do not warrant that everything on the website is complete, accurate or up to date at all times. Content may change without notice.",
      },
    ],
  },
  {
    id: "third-party",
    heading: "5. Third-party links and services",
    blocks: [
      {
        type: "p",
        text: "Links to client sites, social platforms and embedded media are provided for convenience. We do not endorse and are not responsible for third-party content, availability or practices.",
      },
    ],
  },
  {
    id: "liability",
    heading: "6. Limitation of liability",
    blocks: [
      {
        type: "p",
        text: "To the maximum extent permitted by law, we are not liable for any loss or damage arising from reliance on the information on this website. Liability for paid engagements is governed by the applicable signed agreement and our Terms & Conditions.",
      },
    ],
  },
  {
    id: "changes",
    heading: "7. Changes to this disclaimer",
    blocks: [
      {
        type: "p",
        text: "We may update this disclaimer at any time. The current version is the one published on this page.",
      },
    ],
  },
  {
    id: "contact",
    heading: "8. Contact information",
    blocks: [{ type: "p", text: contactLine }],
  },
];

export const deliverySections: LegalSection[] = [
  {
    id: "overview",
    heading: "1. Overview",
    blocks: [
      {
        type: "p",
        text: "We deliver digital services and digital assets. We do not ship physical goods, so no shipping charges, couriers or tracking numbers apply. This policy explains how you receive access to what you have engaged us for.",
      },
    ],
  },
  {
    id: "what-you-receive",
    heading: "2. What is delivered",
    blocks: [
      {
        type: "list",
        items: [
          "Websites, web apps and e-commerce stores deployed to your domain or hosting",
          "Mobile applications submitted to the Apple App Store and Google Play under the applicable store review process",
          "Video, avatar, voice and design output delivered as downloadable files or shared drive links",
          "Marketing deliverables such as content calendars, campaign assets and reports",
          "Company-issued website accounts with dashboard access, where applicable",
        ],
      },
    ],
  },
  {
    id: "access-after-payment",
    heading: "3. Access after payment",
    blocks: [
      {
        type: "p",
        text: "Access to deliverables, source files, credentials and account handovers is released according to the milestone and payment schedule in your proposal or agreement. Where a website account is required, credentials are issued by the company after your access request is approved and are shared with you directly.",
      },
    ],
  },
  {
    id: "delivery-areas",
    heading: "4. Delivery areas",
    blocks: [
      {
        type: "p",
        text: "Because delivery is digital, we serve clients in India and internationally, wherever we can lawfully provide services.",
      },
    ],
  },
  {
    id: "timelines",
    heading: "5. Processing and delivery timelines",
    blocks: [
      {
        type: "p",
        text: "Timelines are defined per project in your proposal, because scope varies widely between a single video edit and a full platform build. Store review times for iOS and Android are controlled by Apple and Google and are outside our control. [Placeholder: standard turnaround times per service to be confirmed by the company.]",
      },
    ],
  },
  {
    id: "delays",
    heading: "6. Delayed or failed delivery",
    blocks: [
      {
        type: "p",
        text: "If a delivery is delayed, we will inform you with a revised date and the reason. Common causes are pending inputs, approvals, domain or hosting access from your side, or third-party review queues. If you have not received an expected file or access, contact us and we will re-share it.",
      },
    ],
  },
  {
    id: "wrong-details",
    heading: "7. Incorrect delivery details",
    blocks: [
      {
        type: "p",
        text: "Deliverables are sent to the email address or account you provide. Please make sure it is correct and can receive large files or drive links. If details change, notify us in writing and we will re-issue access to the corrected address.",
      },
    ],
  },
  {
    id: "corrupt-files",
    heading: "8. Damaged or unusable files",
    blocks: [
      {
        type: "p",
        text: "If a delivered file is corrupted or cannot be opened, tell us within a reasonable time and we will re-export or re-share it at no additional cost.",
      },
    ],
  },
  {
    id: "contact",
    heading: "9. Contact information",
    blocks: [{ type: "p", text: contactLine }],
  },
];
