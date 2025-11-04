"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useTranslations } from "next-intl"
import { staggerChildren, fadeInUp } from "../../context/design-system/motion/variants"

export function Steps() {
  const t = useTranslations('steps')
  const shouldReduce = useReducedMotion()

  const variants = shouldReduce ? {} : {
    container: staggerChildren,
    item: fadeInUp
  }

  const steps = [
    {
      number: "01",
      titleKey: "step1.title",
      subtitleKey: "step1.subtitle",
      descriptionKey: "step1.description",
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
      titleKey: "step2.title",
      subtitleKey: "step2.subtitle",
      descriptionKey: "step2.description",
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
      titleKey: "step3.title",
      subtitleKey: "step3.subtitle",
      descriptionKey: "step3.description",
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

  return (
    <section className="pt-8 md:pt-12 pb-4 md:pb-6 bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-900">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={variants.container}
        >
          {/* Section Title */}
          <motion.h2
            className="font-heading text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
            variants={variants.item}
          >
            {t('title')}
          </motion.h2>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div key={step.number} variants={variants.item} className="relative group">
                {/* Connector Line (hidden on mobile, shown on md+) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[calc(50%+48px)] w-[calc(100%-96px)] h-[2px] bg-accent opacity-20" />
                )}

                <div className="relative bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg px-8 py-4 h-full transition-all duration-300 hover:border-accent hover:shadow-lg">
                  {/* Icon Circle */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-accent flex items-center justify-center text-gray-900 transition-transform duration-300 group-hover:scale-110">
                      <div className="w-8 h-8">{step.icon}</div>
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gray-900 dark:bg-accent text-accent dark:text-gray-900 flex items-center justify-center font-heading font-bold text-sm">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center space-y-3">
                    <h3 className="font-heading font-bold text-xl md:text-2xl text-gray-900 dark:text-white">
                      {t(step.titleKey)}
                    </h3>
                    <p className="font-body font-semibold text-base text-gray-700 dark:text-gray-300">
                      {t(step.subtitleKey)}
                    </p>
                    <p className="font-body text-sm leading-relaxed text-gray-500 dark:text-gray-500">
                      {t(step.descriptionKey)}
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
