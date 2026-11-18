import { useEffect, useState } from 'react';
import Seo from '../../../Utils/Seo';
import { base_url } from '../../../config/config';
import { useLanguage, pickField } from '../../../context/LanguageContext';

const Faq = () => {
    const { language } = useLanguage();
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${base_url}/faq`)
            .then((res) => res.json())
            .then((data) => setFaqs(Array.isArray(data) ? data : []))
            .catch((err) => console.error('Error fetching FAQs:', err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Seo
                title="Frequently Asked Questions"
                description="Answers to common questions about ordering printing and packaging from PriPackLab — prices, cash on delivery, delivery time across Bangladesh and more."
                keywords={['printing delivery Bangladesh', 'printing order online Bangladesh', 'cash on delivery printing']}
                path="/faq"
                jsonLd={faqs.length > 0 && {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: faqs.map((faq) => ({
                        '@type': 'Question',
                        name: faq.faqquestion,
                        acceptedAnswer: { '@type': 'Answer', text: faq.faqanswer },
                    })),
                }}
            />

            <div className="max-w-3xl mx-auto px-6 py-16 mt-16">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Frequently Asked Questions</h1>
                <p className="text-slate-500 mb-8">Answers to common questions about our products and service.</p>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : faqs.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">No FAQs available yet.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {faqs.map((faq, i) => (
                            <div key={faq._id} className="collapse collapse-plus bg-slate-50 rounded-xl border border-slate-100">
                                <input type="radio" name="faq-accordion" defaultChecked={i === 0} />
                                <div className="collapse-title text-base font-semibold text-slate-800">
                                    {pickField(faq, 'faqquestion', language)}
                                </div>
                                <div className="collapse-content">
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {pickField(faq, 'faqanswer', language)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Faq;
