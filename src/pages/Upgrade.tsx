import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { usePageTitle } from "../hooks/usePageTitle";
import gsap from "gsap";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  annualPrice?: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonStyle: string;
  icon: string;
  gradient: string;
  savings?: string;
  cardIcon: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Starter",
    price: "$0",
    period: "month",
    description: "Perfect for getting started with basic task management",
    features: [
      "Unlimited tasks",
      "Unlimited subtasks",
      "Basic task organization",
      "7-day calendar view",
      "Custom lists (max 5)",
    ],
    buttonText: "Current Plan",
    buttonStyle:
      "bg-neu-gre-300 dark:bg-neu-gre-700 text-neu-gre-600 dark:text-neu-gre-300 cursor-not-allowed",
    icon: "mingcute:user-line",
    gradient:
      "from-neu-gre-100 to-neu-gre-200 dark:from-neu-gre-700 dark:to-neu-gre-600",
    cardIcon: "mingcute:user-3-line",
  },
  {
    id: "pro",
    name: "Pro ✨ ",
    price: "$7.99",
    annualPrice: "$79.99",
    period: "month",
    description:
      "Supercharge your productivity with your personal AI assistant for structured task management and goal achievement",
    features: [
      "AI Bot for all your task needs",
      "AI task breakdown",
      "Everything in Starter plan",
      "AI goals & tasks generator",
      "Advanced statistics",
      "Smart task suggestions",
      "AI habit detection, tracking and creation",
      "Custom lists (max 50)",
      "Advanced task filtering & search",
      "Priority support",
      "Advanced list features & tools",
    ],
    popular: true,
    buttonText: "Start Free Trial",
    buttonStyle: "bg-pri-pur-500 hover:bg-pri-pur-600 text-white",
    icon: "mingcute:magic-wand-line",
    gradient:
      "from-pri-pur-100 to-pri-pur-200 dark:from-pri-pur-900 dark:to-pri-pur-800",
    savings: "Save 17%",
    cardIcon: "mingcute:flash-line",
  },
  {
    id: "unlimited",
    name: "Unlimited ♾️",
    price: "$19.99",
    annualPrice: "$199.99",
    period: "month",
    description: "For teams and power users who need maximum productivity",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Advanced AI features",
      "Custom integrations",
      "Unlimited projects",
      "Advanced reporting",
      "24/7 priority support",
      "API access",
      "White-label options",
      "Custom branding",
    ],
    buttonText: "Coming soon",
    buttonStyle:
      "bg-neu-gre-300 dark:bg-neu-gre-700 text-neu-gre-600 dark:text-neu-gre-300 cursor-not-allowed",
    icon: "mingcute:crown-line",
    gradient:
      "from-pri-pur-100 via-pri-tea-100 to-pri-pur-200 dark:from-pri-pur-900 dark:via-pri-tea-900 dark:to-pri-pur-800",
    savings: "Save 17%",
    cardIcon: "mingcute:group-3-line",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechCorp",
    content:
      "Noted's AI task division has revolutionized how I break down complex projects. I'm twice as much productive!",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Marcus Johnson",
    role: "Freelance Designer",
    company: "Independent",
    content:
      "The smart suggestions feature helps me stay organized and never miss important deadlines.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Emily Rodriguez",
    role: "Team Lead",
    company: "StartupXYZ",
    content:
      "Our team collaboration features have made project management seamless. Highly recommended!",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
];

const faqs = [
  {
    question: "Can I change my plan anytime?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately. Got an ",
    answerWithLink: true,
  },
  {
    question: "Is there a free trial?",
    answer:
      "All paid plans come with a 7-day free trial. No credit card required to start. You can cancel anytime during the trial period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely! Cancel anytime with no cancellation fees. You'll keep access until the end of your billing period.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your data is encrypted and stored securely. We're SOC 2 compliant and never share your personal information with third parties.",
  },
];

export function Upgrade() {
  const navigate = useNavigate();
  usePageTitle("Upgrade");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "annual"
  );
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Refs for the glow elements
  const glowRef1 = useRef<HTMLDivElement>(null);
  const glowRef2 = useRef<HTMLDivElement>(null);

  // GSAP animation for pulsating glow
  useEffect(() => {
    if (glowRef1.current && glowRef2.current) {
      // Set initial values
      gsap.set(glowRef1.current, { opacity: 0.08, scale: 1 });
      gsap.set(glowRef2.current, { opacity: 0.05, scale: 1 });

      // Create smooth, continuous pulsing animations with yoyo
      const timeline = gsap.timeline({ repeat: -1 });
      timeline.to(glowRef1.current, {
        opacity: 0.12,
        scale: 1.02,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 1,
      });

      const timeline2 = gsap.timeline({ repeat: -1, delay: 1.5 });
      timeline2.to(glowRef2.current, {
        opacity: 0.08,
        scale: 1.01,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 1,
      });

      return () => {
        timeline.kill();
        timeline2.kill();
      };
    }
  }, []);

  const handleUpgrade = (tierId: string) => {
    if (tierId === "free" || tierId === "unlimited") return; // Don't allow clicking on current plan or coming soon plans

    // Here you would integrate with your payment processor
    console.log(`Upgrading to ${tierId} tier (${billingCycle})`);

    // For now, just show a success message and redirect
    // In a real app, you'd handle the payment flow here
    alert(
      `Starting free trial for ${tierId} tier! Payment integration would happen here.`
    );
    navigate("/dashboard");
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-pri-blue-50 via-neu-gre-50 to-pri-pur-50 dark:from-neu-gre-900 dark:via-neu-gre-800 dark:to-neu-gre-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center mb-6">
              <img
                src="/assets/favicon/Noted-app-icon.png"
                alt="Noted"
                className="h-16 w-16"
              />
            </div>
            <h1 className="text-5xl font-bold text-neu-gre-800 dark:text-neu-gre-100 mb-4">
              Unlock Your Productivity
            </h1>
            <p className="text-xl text-neu-gre-600 dark:text-neu-gre-300 max-w-2xl mx-auto mb-8">
              Choose the perfect plan for your needs. Upgrade to access advanced
              powerful AI bots and get more done faster.
            </p>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-2 text-sm text-neu-gre-600 dark:text-neu-gre-400">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-neu-gre-400 to-neu-gre-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  S
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-neu-gre-500 to-neu-gre-700 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  M
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-neu-gre-300 to-neu-gre-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  E
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-neu-gre-400 to-neu-gre-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  +
                </div>
              </div>
              <span>Join 1000+ productive users</span>
            </div>
          </motion.div>

          {/* Billing Toggle - positioned above cards */}
          <div className="flex justify-start mb-8">
            <div className="bg-white dark:bg-neu-gre-800 rounded-xl p-1 shadow-lg flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center ${
                  billingCycle === "monthly"
                    ? "bg-neu-gre-600 dark:bg-neu-gre-700 text-white"
                    : "text-neu-gre-600 dark:text-neu-gre-300 hover:text-neu-gre-800 dark:hover:text-neu-gre-100"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center ${
                  billingCycle === "annual"
                    ? "bg-green-500 text-white"
                    : "text-neu-gre-600 dark:text-neu-gre-300 hover:text-neu-gre-800 dark:hover:text-neu-gre-100"
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full flex items-center">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-center">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative transition-all duration-300 ${
                  tier.popular ? "scale-105" : ""
                }`}
              >
                {/* Gradient Border for Pro Plan */}
                {tier.popular && (
                  <div className="absolute inset-0 bg-gradient-to-r from-pri-pur-500 to-pri-tea-500 rounded-3xl p-[2px] z-10">
                    <div className="bg-white dark:bg-neu-gre-800 rounded-3xl h-full w-full"></div>
                  </div>
                )}

                {/* Subtle pulsating blue glow for Pro Plan - appears behind the card */}
                {tier.popular && (
                  <div
                    className="absolute -inset-4 rounded-3xl pointer-events-none"
                    style={{ zIndex: 0 }}
                  >
                    <div
                      ref={glowRef1}
                      className="absolute inset-0 bg-pri-blue-500 blur-2xl"
                    ></div>
                    <div
                      ref={glowRef2}
                      className="absolute inset-0 bg-pri-blue-400 blur-xl"
                    ></div>
                  </div>
                )}

                <div
                  className={`relative bg-neu-whi-100 dark:bg-neu-gre-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 z-20 border-2 border-neu-gre-200 dark:border-neu-gre-700 ${
                    tier.popular
                      ? "bg-transparent dark:bg-transparent shadow-none border-none"
                      : ""
                  }`}
                >
                  {/* Popular Badge */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30">
                      <div className="bg-gradient-to-r from-sup-war-500 to-sup-war-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Tier Icon */}
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${tier.gradient} rounded-2xl flex items-center justify-center mb-6`}
                  >
                    <Icon
                      icon={tier.cardIcon}
                      className="w-8 h-8 text-pri-pur-600 dark:text-pri-pur-400"
                    />
                  </div>

                  {/* Tier Info */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-neu-gre-800 dark:text-neu-gre-100 mb-2">
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline mb-2">
                      <span className="text-4xl font-bold text-neu-gre-800 dark:text-neu-gre-100">
                        {billingCycle === "annual" && tier.annualPrice
                          ? tier.annualPrice
                          : tier.price}
                      </span>
                      <span className="text-neu-gre-600 dark:text-neu-gre-300 ml-2">
                        /{billingCycle === "annual" ? "year" : tier.period}
                      </span>
                      {billingCycle === "annual" && tier.savings && (
                        <span className="ml-2 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-semibold">
                          {tier.savings}
                        </span>
                      )}
                    </div>
                    <p className="text-neu-gre-600 dark:text-neu-gre-300">
                      {tier.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.5 + featureIndex * 0.1,
                        }}
                        className="flex items-center space-x-3"
                      >
                        <Icon
                          icon="mingcute:check-line"
                          className="w-5 h-5 text-pri-pur-500 dark:text-pri-pur-400 flex-shrink-0"
                        />
                        <span className="text-neu-gre-700 dark:text-neu-gre-300">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Upgrade Button */}
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                      tier.id === "pro"
                        ? "bg-pri-pur-500 hover:bg-pri-pur-600 text-white"
                        : tier.buttonStyle
                    } ${
                      tier.id === "free" || tier.id === "unlimited"
                        ? "cursor-not-allowed"
                        : "hover:scale-105"
                    }`}
                    disabled={tier.id === "free" || tier.id === "unlimited"}
                  >
                    {tier.buttonText}
                  </button>

                  {/* Trust Indicators */}
                  {tier.id !== "free" && tier.id !== "unlimited" && (
                    <div className="mt-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-neu-gre-500 dark:text-neu-gre-400">
                        <Icon
                          icon="mingcute:shield-check-line"
                          className="w-4 h-4"
                        />
                        <span>7-day free trial • Cancel anytime</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center text-neu-gre-800 dark:text-neu-gre-100 mb-8">
              Loved by productivity enthusiasts around the globe
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className="bg-neu-whi-100 dark:bg-neu-gre-800 rounded-xl p-6 shadow-lg border-2 border-neu-gre-200 dark:border-neu-gre-700"
                >
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-3 object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-neu-gre-800 dark:text-neu-gre-100">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-neu-gre-600 dark:text-neu-gre-400">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <p className="text-neu-gre-700 dark:text-neu-gre-300 italic">
                    "{testimonial.content}"
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* AI Features Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-pri-pur-500 to-pri-tea-500 rounded-3xl p-8 text-white text-center mb-16"
          >
            <Icon
              icon="mingcute:magic-wand-line"
              className="w-12 h-12 mx-auto mb-4"
            />
            <h2 className="text-3xl font-bold mb-4">
              AI-Powered Task Management
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Let AI help you break down complex tasks into manageable pieces
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/10 rounded-xl p-4">
                <Icon icon="mingcute:brain-line" className="w-8 h-8 mb-2" />
                <h3 className="font-semibold mb-2">Smart Division</h3>
                <p className="text-sm opacity-80">
                  AI analyzes your tasks and suggests logical breakdowns
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <Icon icon="mingcute:lightbulb-line" className="w-8 h-8 mb-2" />
                <h3 className="font-semibold mb-2">Intelligent Suggestions</h3>
                <p className="text-sm opacity-80">
                  Get personalized task recommendations based on your patterns
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <Icon icon="mingcute:chart-line" className="w-8 h-8 mb-2" />
                <h3 className="font-semibold mb-2">Productivity Insights</h3>
                <p className="text-sm opacity-80">
                  Understand your work patterns and optimize your workflow
                </p>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16"
          >
            <h2 className="text-3xl font-bold text-center text-neu-gre-800 dark:text-neu-gre-100 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="max-w-4xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  className="bg-white dark:bg-neu-gre-800 rounded-xl shadow-lg"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-neu-gre-50 dark:hover:bg-neu-gre-700 rounded-xl transition-colors duration-200"
                  >
                    <h3 className="font-semibold text-neu-gre-800 dark:text-neu-gre-100">
                      {faq.question}
                    </h3>
                    <Icon
                      icon={
                        expandedFaq === index
                          ? "mingcute:up-line"
                          : "mingcute:down-line"
                      }
                      className="w-5 h-5 text-neu-gre-600 dark:text-neu-gre-400 transition-transform duration-200"
                    />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 text-neu-gre-600 dark:text-neu-gre-300">
                          {faq.answerWithLink ? (
                            <>
                              {faq.answer}
                              <a
                                href="/upgrade"
                                className="text-pri-pur-500 hover:text-pri-pur-600 underline"
                              >
                                annual plan
                              </a>
                              ?
                            </>
                          ) : (
                            faq.answer
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
