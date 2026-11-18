import Seo from '../../Utils/Seo';
import { ShieldCheck, Database, Share2, Cookie, Lock, Mail } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: '1. Information We Collect',
    body: [
      'When you create an account, place an order, or register as a seller on PriPackLab, we collect information such as your name, phone number, email address, delivery address, and payment details.',
      'We also automatically collect certain technical information — device type, browser, IP address, and pages visited — to help us improve the platform and keep it secure.',
    ],
  },
  {
    icon: Share2,
    title: '2. How We Use Your Information',
    body: [
      'We use the information we collect to process orders, deliver products, communicate order and rider updates, provide customer support, and improve our products and services.',
      'Seller account information is used to manage seller profiles, list products, and route orders to the correct seller for fulfillment.',
    ],
  },
  {
    icon: Lock,
    title: '3. How We Protect Your Information',
    body: [
      'We use industry-standard security measures — including encrypted connections and access controls — to protect your personal data from unauthorized access, alteration, or disclosure.',
      'Payment information is processed through secure, trusted payment gateways. PriPackLab does not store your full card details on its own servers.',
    ],
  },
  {
    icon: Cookie,
    title: '4. Cookies & Tracking',
    body: [
      'We use cookies and local storage to keep you logged in, remember your cart, and understand how you use our site so we can make it better.',
      'You can disable cookies from your browser settings, though some features of the site may not work correctly without them.',
    ],
  },
  {
    icon: Share2,
    title: '5. Sharing of Information',
    body: [
      'We share your information only where necessary — with delivery riders to fulfill orders, with sellers whose products you purchase, and with payment partners to process transactions.',
      'We do not sell your personal information to third parties.',
    ],
  },
  {
    icon: ShieldCheck,
    title: '6. Your Rights',
    body: [
      'You may access, update, or request deletion of your personal information at any time by contacting us or through your account profile.',
      'You may also opt out of marketing communications while still receiving essential order and account updates.',
    ],
  },
];

const PrivacyPolicy = () => (
  <>
    <Seo
      title="Privacy Policy"
      description="Read PriPackLab's Privacy Policy to understand how we collect, use, and protect your personal information across our platform."
      path="/privacy-policy"
    />

    <main className="bg-white min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-gradient-to-br from-teal-50 to-cyan-100 opacity-60 translate-x-1/3 -translate-y-1/4" />
        </div>

        <div className="max-w-3xl mx-auto px-6 py-16 lg:py-20 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            Privacy Policy
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            Your Privacy Matters to Us
          </h1>
          <p className="text-slate-500 leading-relaxed mb-2">
            This Privacy Policy explains how PriPackLab collects, uses, and safeguards your information when you use our website, place orders, or sell on our platform.
          </p>
          <p className="text-xs text-slate-400 mb-12">Last updated: August 2026</p>

          <div className="space-y-8">
            {sections.map(({ icon: Icon, title, body }, i) => (
              <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-teal-600" />
                  </div>
                  <h2 className="text-base font-bold text-slate-800">{title}</h2>
                </div>
                {body.map((p, j) => (
                  <p key={j} className="text-sm text-slate-500 leading-relaxed mb-2 last:mb-0">{p}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Questions about this policy?</p>
              <p className="text-sm text-slate-500">Reach us at <a href="mailto:support@pripacklab.com" className="text-teal-600 font-medium">support@pripacklab.com</a></p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </>
);

export default PrivacyPolicy;
