import { useLanguage, pickField } from '../../context/LanguageContext';

const Steps = ({ process = [] }) => {
    const { language } = useLanguage();
    if (!process.length) return null;

    const steps = process[0];

    const stepList = [
        {
            number: "01",
            label: "Place Order",
            text: pickField(steps, 'step1', language),
            bg: "from-teal-100 via-cyan-50 to-teal-50",
            slash: "bg-teal-400",
            label_color: "text-teal-700",
            num_color: "text-teal-800",
            arrow_color: "text-teal-400",
        },
        {
            number: "02",
            label: "We Process",
            text: pickField(steps, 'step2', language),
            bg: "from-cyan-100 via-yellow-50 to-cyan-50",
            slash: "bg-cyan-400",
            label_color: "text-cyan-700",
            num_color: "text-cyan-800",
            arrow_color: "text-cyan-400",
        },
        {
            number: "03",
            label: "Get Delivered",
            text: pickField(steps, 'step3', language),
            bg: "from-yellow-100 via-teal-50 to-yellow-50",
            slash: "bg-yellow-300",
            label_color: "text-yellow-700",
            num_color: "text-yellow-800",
            arrow_color: "text-yellow-400",
        },
    ].filter(s => s.text);

    if (!stepList.length) return null;

    return (
        <div className="w-full  mb-4">
            <h2 className="text-xl font-bold text-teal-500 mb-2">
                How It Works
            </h2>

            <div className="hidden md:flex items-center gap-5">
                {stepList.map((step, index) => (
                    <div key={step.number} className="flex items-center w-full  ">

                        <div className={`flex-1 relative rounded-2xl overflow-hidden   transition-transform duration-300 hover:border-indigo-400 hover:scale-105 bg-gradient-to-br ${step.bg} min-h-[160px]`}>
                         
                            <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-30 ${step.slash}`} />

                            <div className="relative z-10 p-6 flex flex-col gap-1.5 h-full">
                                {/* Big muted number */}
                                <span className={`font-black text-5xl leading-none opacity-15 ${step.num_color} select-none`}>
                                    {step.number}
                                </span>
                                {/* Label */}
                                <span className={`text-[11px] font-bold uppercase tracking-widest ${step.label_color}`}>
                                    {step.label}
                                </span>
                                {/* Text */}
                                <p className="text-sm text-gray-600 leading-relaxed mt-1">
                                    {step.text}
                                </p>
                            </div>
                        </div>

                        {/* Arrow */}
                   
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-0  md:hidden">
                {stepList.map((step, index) => (
                    <div key={step.number} className="flex flex-col items-center">

                        <div className={`w-full my-2 relative rounded-2xl overflow-hidden bg-gradient-to-br hover:border-indigo-400 ${step.bg}`}>
                            <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-30 ${step.slash}`} />
                            <div className="relative z-1 p-5 flex flex-col gap-1.5">
                                <span className={`font-black text-4xl leading-none opacity-15 ${step.num_color} select-none`}>
                                    {step.number}
                                </span>
                                <span className={`text-[11px] font-bold uppercase tracking-widest ${step.label_color}`}>
                                    {step.label}
                                </span>
                                <p className="text-sm text-gray-600 leading-relaxed mt-1">{step.text}</p>
                            </div>
                        </div>

                    
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Steps;