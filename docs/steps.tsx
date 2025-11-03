"use client"

import { motion } from "framer-motion"
import { staggerChildren, fadeInUp } from "../context/design-system/motion/variants"

const steps = [
  {
    number: "01",
    title: "Start now",
    subtitle: "Tell us about your vision",
    description: "In just 15 minutes, our smart form captures the essence of your business.",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Approve your project",
    subtitle: "In five days, you'll receive a complete website",
    description: "Beautiful, branded, and ready to launch in English and Italian.",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.76489 14.1003 1.98232 16.07 2.86"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 4L12 14.01L9 11.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Go live & grow",
    subtitle: "Launch your business online",
    description: "Attract new customers and build lasting loyalty through our platform.",
    icon: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export function Steps() {
  return (
    <section className="py-8 md:py-12 bg-gradient-to-b from-[rgb(var(--wb-gray-100))] to-[rgb(var(--wb-color-white))] dark:from-[rgb(var(--wb-gray-900))] dark:to-[rgb(var(--wb-gray-900))]">
      <div className="container mx-auto px-4 md:px-6 max-w-[var(--wb-max-content)]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerChildren}
        >
          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div key={step.number} variants={fadeInUp} className="relative group">
                {/* Connector Line (hidden on mobile, shown on md+) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[calc(50%+48px)] w-[calc(100%-96px)] h-[2px] bg-[rgb(var(--wb-color-accent))] opacity-20" />
                )}

                <div className="relative bg-[rgb(var(--wb-color-white))] dark:bg-[rgb(var(--wb-gray-900))] border-2 border-[rgb(var(--wb-gray-300))] dark:border-[rgb(var(--wb-gray-700))] rounded-[var(--wb-radius-lg)] p-8 h-full transition-all duration-300 hover:border-[rgb(var(--wb-color-accent))] hover:shadow-[var(--wb-elev-lg)]">
                  {/* Icon Circle */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[rgb(var(--wb-color-accent))] flex items-center justify-center text-[rgb(var(--wb-gray-900))] transition-transform duration-300 group-hover:scale-110">
                      <div className="w-8 h-8">{step.icon}</div>
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[rgb(var(--wb-gray-900))] dark:bg-[rgb(var(--wb-color-accent))] text-[rgb(var(--wb-color-accent))] dark:text-[rgb(var(--wb-gray-900))] flex items-center justify-center font-[family-name:var(--wb-font-heading)] font-bold text-sm">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center space-y-3">
                    <h3 className="font-[family-name:var(--wb-font-heading)] font-bold text-xl md:text-2xl text-[rgb(var(--wb-gray-900))] dark:text-[rgb(var(--wb-color-white))]">
                      {step.title}
                    </h3>
                    <p className="font-[family-name:var(--wb-font-body)] font-semibold text-base text-[rgb(var(--wb-gray-700))] dark:text-[rgb(var(--wb-gray-300))]">
                      {step.subtitle}
                    </p>
                    <p className="font-[family-name:var(--wb-font-body)] text-sm leading-relaxed text-[rgb(var(--wb-gray-500))] dark:text-[rgb(var(--wb-gray-500))]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
