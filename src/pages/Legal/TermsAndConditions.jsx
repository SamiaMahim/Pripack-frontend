import Seo from '../../Utils/Seo';
import { FileText, ShoppingBag, Truck, CreditCard, Store, AlertTriangle } from 'lucide-react';

const sections = [
  {
    icon: FileText,
    title: '1. Acceptance of Terms',
    body: [
      'By accessing or using PriPackLab, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our platform.',
    ],
  },
  {
    icon: ShoppingBag,
    title: '2. Orders & Products',
    body: [
      'All product descriptions, images, and prices on PriPackLab are provided for reference and may be updated without prior notice.',
      'By placing an order, you confirm that the details provided (delivery address, contact number, and product specifications) are accurate. PriPackLab is not responsible for delays or delivery issues arising from incorrect information.',
    ],
  },
  {
    icon: Store,
    title: '3. Seller Accounts',
    body: [
      'Sellers who register on PriPackLab are responsible for the accuracy of the product listings, pricing, and stock they add to their shop from the products made available by the admin.',
      'PriPackLab reserves the right to suspend or remove a seller account that violates these terms or provides misleading information to customers.',
    ],
  },
  {
    icon: CreditCard,
    title: '4. Payments',
    body: [
      'Payments made through our platform are processed via secure third-party payment gateways. PriPackLab is not liable for issues caused by the payment provider.',
      'Prices are listed in Bangladeshi Taka (BDT) unless stated otherwise, and are inclusive of applicable taxes unless mentioned separately.',
    ],
  },
  {
    icon: Truck,
    title: '5. Delivery',
    body: [
      'Delivery timelines provided at checkout are estimates. PriPackLab and its delivery partners work to meet these timelines but are not liable for delays caused by circumstances beyond our control.',
      'Riders update order status through the PriPackLab app as orders move through processing, dispatch, and delivery.',
    ],
  },
  {
    icon: AlertTriangle,
    title: '6. Limitation of Liability',
    body: [
      'PriPackLab is not liable for any indirect, incidental, or consequential damages arising from the use of our platform or products, to the fullest extent permitted by law.',
      'We reserve the right to update these Terms and Conditions at any time. Continued use of the platform after changes are posted constitutes acceptance of the updated terms.',
    ],
  },
];

const TermsAndConditions = () => (
  <>
    <Seo
      title="Terms & Conditions"
      description="Read the Terms and Conditions governing the use of PriPackLab's website, ordering, and seller platform."
      path="/terms-and-conditions"
    />

    <main className="bg-white min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-gradient-to-br from-teal-50 to-cyan-100 opacity-60 translate-x-1/3 -translate-y-1/4" />
        </div>

        <div className="max-w-3xl mx-auto px-6 py-16 lg:py-20 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            Terms & Conditions
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            Terms of Using PriPackLab
          </h1>
          <p className="text-slate-500 leading-relaxed mb-2">
            Please read these Terms and Conditions carefully before using our website, placing an order, or registering as a seller.
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
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Questions about these terms?</p>
              <p className="text-sm text-slate-500">Reach us at <a href="mailto:support@pripacklab.com" className="text-teal-600 font-medium">support@pripacklab.com</a></p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </>
);

export default TermsAndConditions;
