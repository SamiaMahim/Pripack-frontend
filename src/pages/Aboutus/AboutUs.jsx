import { useEffect, useRef, useState } from 'react';
import Seo from '../../Utils/Seo';
import { MapPin, Package, Award, Users, Clock, Shield } from 'lucide-react';
import { base_url } from '../../config/config';
import { useLanguage, pickField } from '../../context/LanguageContext';

const ICONS = { Package, Award, Users, Clock, Shield, MapPin };

const DEFAULT_ABOUT = {
  heroTag: 'About PriPackLab',
  heroTitleMain: "Bangladesh's Most Trusted",
  heroTitleHighlight: 'Printing Partner',
  heroDescription:
    '<p><strong>PriPackLab</strong> is a Dhaka-based premium printing and packaging company dedicated to helping businesses build powerful brand identities. From custom business cards and ID cards to full-scale packaging solutions, we deliver quality that speaks for itself.</p>' +
    '<p>Founded in Mirpur-10, Dhaka, we have grown to serve over 3,000 businesses across all 64 districts of Bangladesh. Our state-of-the-art production facility combines cutting-edge technology with skilled craftsmanship to produce materials that meet international standards — at prices that make sense for businesses of every size.</p>' +
    "<p>Whether you're a startup needing your first 100 business cards or an enterprise requiring bulk ID card printing with custom cuts, PriPackLab delivers with speed, precision, and care.</p>",
  officeLabel: 'Head Office',
  officeAddress: 'Mirpur-10, Dhaka-1216, Bangladesh',
  officeEmail: 'support@pripacklab.com',
  stats: [
    { label: 'Products Delivered', value: '50,000+' },
    { label: 'Happy Clients', value: '3,000+' },
    { label: 'Years in Business', value: '5+' },
    { label: 'Cities Served', value: '64' },
  ],
  values: [
    { icon: 'Package', title: 'Premium Quality', desc: 'Every product is crafted with precision using industry-grade materials, ensuring your brand stands out.' },
    { icon: 'Clock', title: 'Fast Turnaround', desc: 'From order to delivery — we move fast without compromising quality, so your deadlines are always met.' },
    { icon: 'Shield', title: 'Trusted & Reliable', desc: 'Thousands of businesses across Bangladesh trust PriPackLab for consistent, dependable printing solutions.' },
    { icon: 'Award', title: 'Certified Excellence', desc: 'Our processes meet international quality benchmarks, giving you professional results every time.' },
  ],
  mapTag: 'Nationwide Coverage',
  mapTitle: 'Delivering Across All of Bangladesh',
  mapDescription:
    'From Teknaf in the south to Tetulia in the north — PriPackLab ships to every corner of Bangladesh. Our logistics network covers all 64 districts with fast, trackable delivery.',
  coverageCards: [
    { icon: 'Users', title: '3,000+ Businesses Served', desc: 'From small startups to large enterprises — businesses across every sector trust PriPackLab for their printing needs.' },
    { icon: 'MapPin', title: 'All 64 Districts Covered', desc: 'Our delivery network spans every district in Bangladesh — urban centers and rural areas alike. We ship from Dhaka within 24–72 hours.' },
    { icon: 'Clock', title: 'Express Production Available', desc: 'Need your order urgently? Our express printing service ensures same-day or next-day production for select products.' },
    { icon: 'Package', title: 'Tracked Nationwide Delivery', desc: 'Every order ships with full tracking so you always know where your products are — from our facility to your doorstep.' },
  ],
  ctaTitle: 'Ready to Elevate Your Brand?',
  ctaDescription: 'Join thousands of businesses that rely on PriPackLab for premium printing, fast delivery, and unmatched quality across Bangladesh.',
  ctaEmail: 'support@pripacklab.com',
};

const AboutUs = () => {
  const mapRef = useRef(null);
  const { language } = useLanguage();
  const [about, setAbout] = useState(DEFAULT_ABOUT);

  useEffect(() => {
    fetch(`${base_url}/aboutus`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Object.keys(data).length) setAbout({ ...DEFAULT_ABOUT, ...data });
      })
      .catch((err) => console.error('Error fetching about us content:', err));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [about]);

  const stats = about.stats?.length ? about.stats : DEFAULT_ABOUT.stats;
  const values = about.values?.length ? about.values : DEFAULT_ABOUT.values;
  const coverageCards = about.coverageCards?.length ? about.coverageCards : DEFAULT_ABOUT.coverageCards;
  const cardAccents = [
    { bg: 'bg-teal-500/20', text: 'text-teal-400' },
    { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    { bg: 'bg-green-500/20', text: 'text-green-400' },
  ];

  return (
    <>
      <Seo
        title="About Us — Printing & Packaging Company in Mirpur, Dhaka"
        description="PriPackLab is a printing and packaging company in Mirpur-10, Dhaka. We serve 3,000+ businesses across all 64 districts of Bangladesh with custom business cards, ID cards, packaging and branding materials."
        keywords={['printing company in Dhaka', 'printing press Mirpur 10', 'packaging company Dhaka', 'printing company Bangladesh', 'মিরপুর প্রিন্টিং প্রেস']}
        path="/aboutus"
      />

      <main className="bg-white min-h-screen">

        {/* ── Section 1: Hero + About ─────────────────────── */}
        <section className="relative overflow-hidden">

          {/* Background accent */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-gradient-to-br from-teal-50 to-cyan-100 opacity-60 translate-x-1/3 -translate-y-1/4" />
          </div>

          <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28 relative">

            {/* Tag */}
            <div className="reveal opacity-0 translate-y-4 transition-all duration-700 inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              {pickField(about, 'heroTag', language)}
            </div>

            <div className="reveal opacity-0 translate-y-4 transition-all duration-700 delay-100 grid lg:grid-cols-2 gap-12 items-center">

              {/* Left: text */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                  {pickField(about, 'heroTitleMain', language)}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">
                    {pickField(about, 'heroTitleHighlight', language)}
                  </span>
                </h1>

                <div
                  className="text-base text-slate-500 leading-relaxed space-y-4 [&_strong]:text-slate-800 [&_p:first-child]:text-lg [&_p:first-child]:text-slate-600"
                  dangerouslySetInnerHTML={{ __html: pickField(about, 'heroDescription', language) }}
                />

                {/* Contact pill */}
                <div className="mt-8 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{pickField(about, 'officeLabel', language)}</p>
                    <p className="text-sm font-semibold text-slate-700">{pickField(about, 'officeAddress', language)}</p>
                    <p className="text-xs text-slate-400">{about.officeEmail}</p>
                  </div>
                </div>
              </div>

              {/* Right: stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-teal-400 via-cyan-400 to-yellow-300 p-0.5 rounded-2xl"
                  >
                    <div className="bg-white rounded-[14px] p-6 h-full text-center">
                      <p className="text-3xl lg:text-4xl font-extrabold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500 mt-1 font-medium">{pickField(stat, 'label', language)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Values */}
            <div className="reveal opacity-0 translate-y-4 transition-all duration-700 delay-200 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
              {values.map((value, i) => {
                const Icon = ICONS[value.icon] || Package;
                return (
                  <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all duration-200">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">{pickField(value, 'title', language)}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{pickField(value, 'desc', language)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Section 2: Bangladesh Map ───────────────────── */}
        <section className="bg-slate-900 relative overflow-hidden py-20 lg:py-28">

          {/* Decorative circles */}
          <div className="absolute top-10 left-10 w-48 h-48 rounded-full border border-white/5" />
          <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full border border-white/5" />

          <div className="max-w-6xl mx-auto px-6">
            <div className="reveal opacity-0 translate-y-4 transition-all duration-700 text-center mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-teal-300 rounded-full text-sm font-semibold mb-4">
                <MapPin className="w-3.5 h-3.5" /> {pickField(about, 'mapTag', language)}
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
                {pickField(about, 'mapTitle', language)}
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
                {pickField(about, 'mapDescription', language)}
              </p>
            </div>

            <div className="reveal opacity-0 translate-y-4 transition-all duration-700 delay-100 flex flex-col lg:flex-row items-center gap-12">

              {/* SVG Bangladesh Map */}
          <img            ref={mapRef}
            src="/assets/bdmap.svg"
            alt="Bangladesh Map"
            className="w-full max-w-md lg:w-[600px] h-auto drop-shadow-lg"
          />
              {/* Coverage details */}
              <div className="flex-1 space-y-5">
                {coverageCards.map((card, i) => {
                  const Icon = ICONS[card.icon] || Users;
                  const accent = cardAccents[i % cardAccents.length];
                  return (
                    <div key={i} className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <div className={`w-10 h-10 rounded-xl ${accent.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${accent.text}`} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1">{pickField(card, 'title', language)}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">{pickField(card, 'desc', language)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: CTA ──────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="reveal opacity-0 translate-y-4 transition-all duration-700">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                {pickField(about, 'ctaTitle', language)}
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                {pickField(about, 'ctaDescription', language)}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/"
                  className="btn-gradient px-8 py-3"
                >
                  Explore Products
                </a>
                <a
                  href={`mailto:${about.ctaEmail}`}
                  className="btn-simple px-8 py-3"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <style>{`
        .reveal { transition: opacity 0.7s ease, transform 0.7s ease; }
        .in-view { opacity: 1 !important; transform: translateY(0) !important; }
        .delay-100 { transition-delay: 0.1s; }
        .delay-200 { transition-delay: 0.2s; }
      `}</style>
    </>
  );
};

export default AboutUs;
