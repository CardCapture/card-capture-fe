import { useState, useEffect } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';

const Differentiator = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('differentiator');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const comparisons = [
    {
      feature: "Works when phones aren't allowed",
      phoneOnly: { type: "x", text: "" },
      cardcapture: { type: "check", text: "Physical cards available" }
    },
    {
      feature: "QR code support",
      phoneOnly: { type: "check", text: "" },
      cardcapture: { type: "check", text: "" }
    },
    {
      feature: "No event coordinator setup required",
      phoneOnly: { type: "x", text: "Requires pre-registration" },
      cardcapture: { type: "check", text: "Just hand out cards" }
    },
    {
      feature: "Fast student interaction",
      phoneOnly: { type: "warning", text: "Students need to find code" },
      cardcapture: { type: "check", text: "Instant—grab a card" }
    },
    {
      feature: "Instant data delivery",
      phoneOnly: { type: "check", text: "" },
      cardcapture: { type: "check", text: "" }
    }
  ];

  return (
    <section id="differentiator" className="relative py-20 md:py-24 overflow-hidden bg-white">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className={`${visible ? 'animate-fade-in' : 'opacity-0'}`}>

          {/* Headline */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Every School <span className="text-primary">Every Situation</span>
            </h2>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              {/* Header */}
              <thead>
                <tr>
                  <th className="text-left p-4 text-lg font-semibold"></th>
                  <th className="text-center p-4 text-lg font-semibold border-l border-foreground/10">Phone-Only Solutions</th>
                  <th className="text-center p-4 text-lg font-semibold border-l border-foreground/10">CardCapture</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {comparisons.map((item, index) => (
                  <tr key={index} className="border-t border-foreground/10">
                    <td className="p-4 font-medium text-left">{item.feature}</td>

                    <td className="p-4 border-l border-foreground/10 text-center">
                      {item.phoneOnly.type === "x" && (
                        <div className="flex flex-col items-center gap-2">
                          <X className="h-6 w-6 text-red-500" strokeWidth={2.5} />
                          {item.phoneOnly.text && <span className="text-sm text-foreground/60">{item.phoneOnly.text}</span>}
                        </div>
                      )}
                      {item.phoneOnly.type === "check" && (
                        <div className="flex flex-col items-center gap-2">
                          <Check className="h-6 w-6 text-green-500" strokeWidth={2.5} />
                          {item.phoneOnly.text && <span className="text-sm text-foreground/60">{item.phoneOnly.text}</span>}
                        </div>
                      )}
                      {item.phoneOnly.type === "warning" && (
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-yellow-500" strokeWidth={2.5} />
                          {item.phoneOnly.text && <span className="text-sm text-foreground/60">{item.phoneOnly.text}</span>}
                        </div>
                      )}
                    </td>

                    <td className="p-4 border-l border-foreground/10 text-center">
                      {item.cardcapture.type === "check" && (
                        <div className="flex flex-col items-center gap-2">
                          <Check className="h-6 w-6 text-green-500" strokeWidth={2.5} />
                          {item.cardcapture.text && <span className="text-sm text-foreground/60">{item.cardcapture.text}</span>}
                        </div>
                      )}
                      {item.cardcapture.type === "x" && (
                        <div className="flex flex-col items-center gap-2">
                          <X className="h-6 w-6 text-red-500" strokeWidth={2.5} />
                          {item.cardcapture.text && <span className="text-sm text-foreground/60">{item.cardcapture.text}</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Differentiator;
