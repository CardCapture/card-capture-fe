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
      feature: "Works even when phones are banned",
      qr: { type: "x", text: "" },
      cardcapture: { type: "check", text: "" }
    },
    {
      feature: "Works at every school",
      qr: { type: "warning", text: "Some blocked" },
      cardcapture: { type: "check", text: "" }
    },
    {
      feature: "No setup required",
      qr: { type: "x", text: "Requires event setup & staff time" },
      cardcapture: { type: "check", text: "Just print and go" }
    },
    {
      feature: "Instant student engagement",
      qr: { type: "x", text: "Slows lines down" },
      cardcapture: { type: "check", text: "Fast and familiar" }
    },
    {
      feature: "Instant data delivery",
      qr: { type: "check", text: "" },
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
              The only solution that works anywhere
            </h2>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              {/* Header */}
              <thead>
                <tr>
                  <th className="text-left p-4 text-lg font-semibold"></th>
                  <th className="text-center p-4 text-lg font-semibold border-l border-foreground/10">QR Signups</th>
                  <th className="text-center p-4 text-lg font-semibold border-l border-foreground/10">CardCapture</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {comparisons.map((item, index) => (
                  <tr key={index} className="border-t border-foreground/10">
                    <td className="p-4 font-medium text-left">{item.feature}</td>

                    <td className="p-4 border-l border-foreground/10 text-center">
                      {item.qr.type === "x" && (
                        <div className="flex flex-col items-center gap-2">
                          <X className="h-6 w-6 text-red-500" strokeWidth={2.5} />
                          {item.qr.text && <span className="text-sm text-foreground/60">{item.qr.text}</span>}
                        </div>
                      )}
                      {item.qr.type === "check" && (
                        <div className="flex flex-col items-center gap-2">
                          <Check className="h-6 w-6 text-green-500" strokeWidth={2.5} />
                          {item.qr.text && <span className="text-sm text-foreground/60">{item.qr.text}</span>}
                        </div>
                      )}
                      {item.qr.type === "warning" && (
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-yellow-500" strokeWidth={2.5} />
                          {item.qr.text && <span className="text-sm text-foreground/60">{item.qr.text}</span>}
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
