"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { X, Linkedin, Github, Menu, X as CloseIcon } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSelector } from "@/components/LanguageSelector"
import { slideFade } from "../../design-system/motion/variants"

export function Navigation() {
  const t = useTranslations('nav')
  const shouldReduce = useReducedMotion()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const variants = shouldReduce ? {} : {
    nav: slideFade('right')
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Close mobile menu when screen size changes to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <motion.nav 
      className="sticky top-0 z-50 w-full bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-800/20"
      variants={variants.nav}
      initial="hidden"
      animate="show"
    >
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
              <div className="h-20 w-20 flex items-center justify-center">
                <Image 
                  src="/images/logo.png" 
                  alt="WhiteBoar Logo" 
                  width={100} 
                  height={100} 
                  className="text-accent dark:text-accent"
                />
              </div>
              <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                WhiteBoar
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Navigation Links */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-accent px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {t('packages')}
              </button>
              <button
                onClick={() => scrollToSection('portfolio')}
                className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-accent px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {t('clients')}
              </button>
            </div>

            {/* Social Icons */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://twitter.com/whiteboar_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <X className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://linkedin.com/company/whiteboar"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://github.com/whiteboar"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* CTA Button */}
            <Button asChild>
              <Link href="/checkout">{t('start')}</Link>
            </Button>

            {/* Language & Theme Controls */}
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 dark:text-white"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/20 dark:border-gray-800/20 bg-white/95 dark:bg-black/95 backdrop-blur-md">
            <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      scrollToSection('pricing')
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-accent px-3 py-2 text-base font-medium transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  >
                    {t('packages')}
                  </button>
                  <button
                    onClick={() => {
                      scrollToSection('portfolio')
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-accent px-3 py-2 text-base font-medium transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  >
                    {t('clients')}
                  </button>
                </div>

                {/* Mobile Controls */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-4">
                    <LanguageSelector />
                    <ThemeToggle />
                  </div>
                </div>

                {/* Mobile CTA */}
                <div className="px-3">
                  <Button asChild className="w-full">
                    <Link href="/checkout" onClick={() => setMobileMenuOpen(false)}>
                      {t('start')}
                    </Link>
                  </Button>
                </div>

                {/* Mobile Social Links */}
                <div className="flex justify-center space-x-4 px-3 pt-2">
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href="https://twitter.com/whiteboar_ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Twitter"
                    >
                      <X className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href="https://linkedin.com/company/whiteboar"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href="https://github.com/whiteboar"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  )
}