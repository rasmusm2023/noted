import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { usePageTitle } from "../hooks/usePageTitle";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonStyle: string;
  icon: string;
  gradient: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with basic task management",
    features: [
      "Unlimited tasks and subtasks",
      "Basic task organization",
      "Goal tracking",
      "7-day calendar view",
      "Dark/Light theme",
      "Basic drag & drop",
    ],
    buttonText: "Current Plan",
    buttonStyle:
      "bg-neu-gre-300 dark:bg-neu-gre-700 text-neu-gre-600 dark:text-neu-gre-300 cursor-not-allowed",
    icon: "mingcute:user-line",
    gradient:
      "from-neu-gre-100 to-neu-gre-200 dark:from-neu-gre-700 dark:to-neu-gre-600",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    period: "month",
    description: "For professionals who need advanced productivity features",
    features: [
      "Everything in Free",
      "✨ AI Task Division",
      "Smart task suggestions",
      "Advanced analytics",
      "Priority task highlighting",
      "Export to PDF/CSV",
      "Priority support",
    ],
    popular: true,
    buttonText: "Upgrade to Pro",
    buttonStyle: "bg-pri-pur-500 hover:bg-pri-pur-600 text-white",
    icon: "mingcute:magic-wand-line",
    gradient:
      "from-pri-pur-100 to-pri-pur-200 dark:from-pri-pur-900 dark:to-pri-pur-800",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "$19",
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
    ],
    buttonText: "Upgrade to Unlimited",
    buttonStyle:
      "bg-gradient-to-r from-pri-pur-500 to-pri-tea-500 hover:from-pri-pur-600 hover:to-pri-tea-600 text-white",
    icon: "mingcute:crown-line",
    gradient:
      "from-pri-pur-100 via-pri-tea-100 to-pri-pur-200 dark:from-pri-pur-900 dark:via-pri-tea-900 dark:to-pri-pur-800",
  },
];

export function Upgrade() {
  const navigate = useNavigate();
  usePageTitle("Upgrade - Noted");
  const [selectedTier, setSelectedTier] = useState<string>("pro");

  const handleUpgrade = (tierId: string) => {
    if (tierId === "free") return; // Don't allow clicking on current plan

    // Here you would integrate with your payment processor
    console.log(`Upgrading to ${tierId} tier`);

    // For now, just show a success message and redirect
    // In a real app, you'd handle the payment flow here
    alert(
      `Upgrading to ${tierId} tier! Payment integration would happen here.`
    );
    navigate("/dashboard");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-pri-blue-50 via-neu-gre-50 to-pri-pur-50 dark:from-neu-gre-900 dark:via-neu-gre-800 dark:to-neu-gre-900 p-8 mt-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pri-pur-500 to-pri-tea-500 rounded-2xl mb-6">
              <Icon
                icon="mingcute:magic-wand-line"
                className="w-8 h-8 text-white"
              />
            </div>
            <h1 className="text-5xl font-bold text-neu-gre-800 dark:text-neu-gre-100 mb-4">
              Unlock Your Productivity
            </h1>
            <p className="text-xl text-neu-gre-600 dark:text-neu-gre-300 max-w-2xl mx-auto">
              Choose the perfect plan for your needs. Upgrade to access
              AI-powered task management and advanced features.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-pri-pur-500 to-pri-tea-500 rounded-3xl p-[2px]">
                    <div className="bg-white dark:bg-neu-gre-800 rounded-3xl h-full w-full"></div>
                  </div>
                )}

                <div
                  className={`relative bg-white dark:bg-neu-gre-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                    tier.popular
                      ? "bg-transparent dark:bg-transparent shadow-none"
                      : ""
                  }`}
                >
                  {/* Popular Badge */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-pri-pur-500 to-pri-tea-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Tier Icon */}
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${tier.gradient} rounded-2xl flex items-center justify-center mb-6`}
                  >
                    <Icon
                      icon={tier.icon}
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
                        {tier.price}
                      </span>
                      <span className="text-neu-gre-600 dark:text-neu-gre-300 ml-2">
                        /{tier.period}
                      </span>
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
                      tier.id === "free"
                        ? "cursor-not-allowed"
                        : "hover:scale-105"
                    }`}
                    disabled={tier.id === "free"}
                  >
                    {tier.buttonText}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Features Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-pri-pur-500 to-pri-tea-500 rounded-3xl p-8 text-white text-center"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-neu-gre-800 rounded-xl p-6">
                <h3 className="font-semibold text-neu-gre-800 dark:text-neu-gre-100 mb-2">
                  Can I change my plan anytime?
                </h3>
                <p className="text-neu-gre-600 dark:text-neu-gre-300">
                  Yes! You can upgrade or downgrade your plan at any time.
                  Changes take effect immediately.
                </p>
              </div>
              <div className="bg-white dark:bg-neu-gre-800 rounded-xl p-6">
                <h3 className="font-semibold text-neu-gre-800 dark:text-neu-gre-100 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-neu-gre-600 dark:text-neu-gre-300">
                  All paid plans come with a 14-day free trial. No credit card
                  required to start.
                </p>
              </div>
              <div className="bg-white dark:bg-neu-gre-800 rounded-xl p-6">
                <h3 className="font-semibold text-neu-gre-800 dark:text-neu-gre-100 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-neu-gre-600 dark:text-neu-gre-300">
                  We accept all major credit cards, PayPal, and bank transfers
                  for annual plans.
                </p>
              </div>
              <div className="bg-white dark:bg-neu-gre-800 rounded-xl p-6">
                <h3 className="font-semibold text-neu-gre-800 dark:text-neu-gre-100 mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-neu-gre-600 dark:text-neu-gre-300">
                  Absolutely! Cancel anytime with no cancellation fees. You'll
                  keep access until the end of your billing period.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
