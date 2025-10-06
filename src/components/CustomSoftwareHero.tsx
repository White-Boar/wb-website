"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { motion, useReducedMotion } from "framer-motion"
import { Code2, Smartphone, Database, LayoutDashboard, Plug, ShoppingCart } from "lucide-react"
import { fadeInUp, staggerChildren } from "../../context/design-system/motion/variants"

export function CustomSoftwareHero() {
  const t = useTranslations('customSoftware')
  const shouldReduce = useReducedMotion()

  const variants = shouldReduce ? {} : {
    container: staggerChildren,
    item: fadeInUp
  }

  const services = [
    {
      icon: Code2,
      title: t('services.webApps'),
      description: t('services.webAppsDesc')
    },
    {
      icon: Smartphone,
      title: t('services.mobileApps'),
      description: t('services.mobileAppsDesc')
    },
    {
      icon: Database,
      title: t('services.saas'),
      description: t('services.saasDesc')
    },
    {
      icon: LayoutDashboard,
      title: t('services.dashboards'),
      description: t('services.dashboardsDesc')
    },
    {
      icon: Plug,
      title: t('services.api'),
      description: t('services.apiDesc')
    },
    {
      icon: ShoppingCart,
      title: t('services.ecommerce'),
      description: t('services.ecommerceDesc')
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Content */}
        <motion.div
          className="text-center mb-16"
          variants={variants.container}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            variants={variants.item}
          >
            {t('hero.title')}
          </motion.h1>

          <motion.p
            className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto"
            variants={variants.item}
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.p
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            variants={variants.item}
          >
            {t('hero.description')}
          </motion.p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={variants.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2
            className="font-heading text-2xl sm:text-3xl font-bold text-center text-foreground mb-12"
            variants={variants.item}
          >
            {t('services.title')}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={index}
                  variants={variants.item}
                  className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
